import localforage from 'localforage';

jest.mock('localforage', () => ({ createInstance: jest.fn() }));
jest.mock('./logoutState', () => ({ isSignedOut: () => false }));

const cacheKeys = ['market_context', 'comments_context', 'investibles', 'market_presences',
  'market_stages', 'market_groups', 'group_members', 'notifications', 'diff_context'];

describe('application cache read recovery', () => {
  let LocalForageHelper;
  let recovery;
  let freshness;
  let storage;
  let warning;

  beforeEach(() => {
    jest.isolateModules(() => {
      LocalForageHelper = require('./LocalForageHelper').default;
      recovery = require('./applicationCacheRecovery');
      freshness = require('../api/crossTabFreshness');
    });
    storage = { getItem: jest.fn(), setItem: jest.fn().mockResolvedValue(true),
      removeItem: jest.fn(), clear: jest.fn() };
    localforage.createInstance.mockReturnValue(storage);
    warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warning.mockRestore();
    jest.clearAllMocks();
  });

  it.each(cacheKeys)('continues without deleting an unreadable %s record', async (key) => {
    storage.getItem.mockRejectedValue(new DOMException('Failed to read large IndexedDB value', 'UnknownError'));
    const helper = new LocalForageHelper(key);
    await expect(helper.getStoredState()).resolves.toBeUndefined();
    await expect(helper.getStoredState()).resolves.toBeUndefined();
    expect(storage.getItem).toHaveBeenCalledTimes(2);
    expect(warning).toHaveBeenCalledTimes(1);
    expect(storage.removeItem).not.toHaveBeenCalled();
    expect(storage.clear).not.toHaveBeenCalled();
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(recovery.hasPendingCacheRebuild()).toBe(key !== 'diff_context');
  });

  it('uses initialized memory for sync without rereading the damaged disk record', async () => {
    const memory = { messages: [{ deleted: true }], pendingClears: [{ typeObjectId: 'clear-me', event: 'remove' }] };
    await expect(new LocalForageHelper('notifications').getState(memory)).resolves.toBe(memory);
    expect(storage.getItem).not.toHaveBeenCalled();
  });

  it('keeps healthy records readable when several other caches fail', async () => {
    const healthy = { marketDetails: [{ id: 'workspace' }] };
    storage.getItem.mockImplementation((key) => key === 'market_context'
      ? Promise.resolve(healthy) : Promise.reject(new DOMException('Unreadable', 'UnknownError')));
    await Promise.all(['comments_context', 'market_presences', 'notifications']
      .map((key) => new LocalForageHelper(key).getStoredState()));
    await expect(new LocalForageHelper('market_context').getStoredState()).resolves.toBe(healthy);
    expect(recovery.getVersionCachesToRebuild().sort()).toEqual(['comments_context', 'market_presences']);
  });

  it('can adopt a repaired cache from another tab after its own read failed', async () => {
    const repaired = { workspace: [{ current_user: true, market_capability_version: 2 }] };
    storage.getItem.mockRejectedValueOnce(new DOMException('Unreadable', 'UnknownError'))
      .mockResolvedValueOnce(repaired);
    const helper = new LocalForageHelper('market_presences');
    await helper.getStoredState();
    await expect(helper.getStoredState()).resolves.toBe(repaired);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('treats a missing cache as awaiting server data, without reporting an error', async () => {
    storage.getItem.mockResolvedValue(null);
    await expect(new LocalForageHelper('market_presences').getStoredState()).resolves.toBeUndefined();
    expect(recovery.getCacheRecoveryStatus()).toBe('loading');
    expect(warning).not.toHaveBeenCalled();
  });

  it('keeps partial snapshots off disk and persists only the completed rebuild', async () => {
    storage.getItem.mockRejectedValue(new DOMException('Unreadable', 'UnknownError'));
    const helper = new LocalForageHelper('market_presences');
    await helper.getStoredState();
    const partial = { active: [{ current_user: true }] };
    const complete = { ...partial, archived: [{ current_user: true }] };
    await freshness.queuePersistenceWrite('presences', () => helper.setState(partial));
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(recovery.hasPendingCacheRebuild()).toBe(true);
    // The final write may still be queued when the server cycle finishes.
    freshness.queuePersistenceWrite('presences', () => helper.setState(complete));
    await recovery.completeCacheRebuild(['market_presences']);
    await freshness.waitForPendingWrites();
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    expect(storage.setItem).toHaveBeenCalledWith('market_presences', complete);
    expect(recovery.hasPendingCacheRebuild()).toBe(false);
  });

  it('invalidates deferred and still-queued recovery writes across leadership loss', async () => {
    recovery.cacheNeedsRebuild('market_presences');
    const oldLeader = new LocalForageHelper('market_presences');
    await freshness.queuePersistenceWrite('presences', () => oldLeader.setState({ active: [] }));
    const queued = freshness.queuePersistenceWrite('presences', () => oldLeader.setState({ active: ['old'] }));
    const completing = recovery.completeCacheRebuild(['market_presences']);
    recovery.cancelCacheRecoveryWrites();
    await Promise.all([queued, completing]);
    expect(recovery.hasPendingCacheRebuild()).toBe(true);
    expect(storage.setItem).not.toHaveBeenCalled();
    // A follower may finish from data written by its new leader. It must not
    // replay the old leader's partial snapshot afterward.
    await recovery.completeCacheRebuild(['market_presences']);
    await freshness.waitForPendingWrites();
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('still drains healthy queued writes when leadership changes', async () => {
    const helper = new LocalForageHelper('notifications');
    const state = { messages: [], pendingClears: [{ typeObjectId: 'pending' }] };
    const queued = freshness.queuePersistenceWrite('notifications', () => helper.setState(state));
    recovery.cancelCacheRecoveryWrites();
    await queued;
    expect(storage.setItem).toHaveBeenCalledWith('notifications', state);
  });

  it.each(['TOKEN_STORAGE_MANAGER', 'ACCOUNT_STORAGE_MANAGER'])('does not apply cache fallback to %s', async (store) => {
    const error = new DOMException('Unreadable', 'UnknownError');
    storage.getItem.mockRejectedValue(error);
    await expect(new LocalForageHelper('market_presences', store).getStoredState()).rejects.toBe(error);
    expect(recovery.hasPendingCacheRebuild()).toBe(false);
    expect(storage.setItem).not.toHaveBeenCalled();
  });
});
