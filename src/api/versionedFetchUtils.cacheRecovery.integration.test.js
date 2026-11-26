let mockDisk;
let mockUnreadable;
// This dependency installs a global polyfill and cannot be re-executed when
// each startup fixture gets a fresh copy of the application's module state.
const mockHtmlDiff = jest.requireActual('htmldiff-js');
jest.mock('htmldiff-js', () => mockHtmlDiff);
const mockSetItem = jest.fn((key, value) => {
  mockDisk.set(key, value);
  mockUnreadable.delete(key);
  return Promise.resolve(value);
});
const mockGetItem = jest.fn((key) => mockUnreadable.has(key)
  ? Promise.reject(new DOMException('Failed to read large IndexedDB value', 'UnknownError'))
  : Promise.resolve(mockDisk.get(key)));

// Storage and authenticated HTTP are the external boundaries. Hydration, context
// reducers, signature matching, sync/release, persistence and readiness are real.
jest.mock('localforage', () => ({ createInstance: () => ({
  getItem: mockGetItem, setItem: mockSetItem, iterate: () => Promise.resolve()
}) }));
jest.mock('./summaries', () => ({ getChangedIds: jest.fn(), getVersions: jest.fn() }));
jest.mock('./marketLogin', () => ({ getMarketClient: jest.fn() }));
jest.mock('../contexts/LeaderContext/LeaderContext', () => ({ leaderContextHack: { isLeader: true } }));

describe('unreadable cache through startup sync', () => {
  let React;
  let act;
  let root;
  let container;
  let sync;
  let recovery;
  let freshness;
  let MarketsProvider;
  let MarketPresencesProvider;
  let Probe;
  let errors;
  let warnings;
  let info;
  let client;
  const user = { id: 'current-user', current_user: true, market_capability_version: 3 };
  const market = { id: 'workspace', version: 2, current_user_id: user.id };

  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
    window.IS_REACT_ACT_ENVIRONMENT = true;
    React = require('react');
    act = React.act;
    const { createRoot } = require('react-dom/client');
    sync = require('./versionedFetchUtils');
    recovery = require('../utils/applicationCacheRecovery');
    freshness = require('./crossTabFreshness');
    const markets = require('../contexts/MarketsContext/MarketsContext');
    const presences = require('../contexts/MarketPresencesContext/MarketPresencesContext');
    MarketsProvider = markets.MarketsProvider;
    MarketPresencesProvider = presences.MarketPresencesProvider;
    const { useInitialSyncComplete } = require('./useInitialSyncComplete');
    const { getNotHiddenMarketDetailsForUser } = require('../contexts/MarketsContext/marketsContextHelper');
    Probe = () => {
      const ready = useInitialSyncComplete('recovery-integration');
      const [marketState] = React.useContext(markets.MarketsContext);
      const [presenceState] = React.useContext(presences.MarketPresencesContext);
      const visible = getNotHiddenMarketDetailsForUser(marketState, presenceState).marketDetails;
      return <div>{ready && visible.length === 1 ? 'Workspace loaded' : 'Loading'}</div>;
    };
    mockDisk = new Map(Object.values(recovery.APPLICATION_CACHE_NAMESPACES).map((key) => [key, {}]));
    mockDisk.set('market_context', { marketDetails: [market] });
    mockUnreadable = new Set(['market_presences']);
    mockGetItem.mockClear();
    mockSetItem.mockClear();
    client = { markets: {
      get: jest.fn().mockResolvedValue(market),
      listUsers: jest.fn().mockResolvedValue([{ ...user }]),
      listInvestments: jest.fn().mockResolvedValue([]),
    } };
    require('./marketLogin').getMarketClient.mockResolvedValue(client);
    require('./summaries').getChangedIds.mockResolvedValue([{ id: market.id, active: true,
      signature: { object_type: 'market', object_id_one: market.id, version: market.version } }]);
    errors = jest.spyOn(console, 'error').mockImplementation(() => {});
    warnings = jest.spyOn(console, 'warn').mockImplementation(() => {});
    info = jest.spyOn(console, 'info').mockImplementation(() => {});
    container = document.createElement('div');
    root = createRoot(container);
  });

  afterEach(() => {
    sync.stopRefreshRunner();
    act(() => root.unmount());
    errors.mockRestore();
    warnings.mockRestore();
    info.mockRestore();
    delete window.IS_REACT_ACT_ENVIRONMENT;
    jest.useRealTimers();
  });

  it.each([
    { name: 'unreadable participants', orphan: false, keys: ['market_presences'] },
    { name: 'unreadable participants and a stale vote signature', orphan: true, keys: ['market_presences'] },
    { name: 'two unreadable caches and a stale vote signature', orphan: true,
      keys: ['market_context', 'market_presences'] },
  ])('loads and persists server data after $name', async ({ orphan, keys }) => {
    mockUnreadable = new Set(keys);
    const signatures = [
      { type: 'market', object_versions: [{ object_id_one: market.id, version: market.version }] },
      { type: 'market_capability', object_versions: [{ object_id_one: user.id, version: 3 }] },
    ];
    if (orphan) {
      // The investment endpoint can successfully return fewer objects than its
      // advertised signatures, including after its consistent-read fallback.
      signatures.push({ type: 'investment', object_versions: [{
        object_id_one: 'removed-vote', object_id_two: user.id, version: 1
      }] });
    }
    require('./summaries').getVersions.mockResolvedValue([{ market_id: market.id, signatures }]);
    await act(async () => root.render(<MarketsProvider><MarketPresencesProvider>
      <Probe />
    </MarketPresencesProvider></MarketsProvider>));
    expect(container.textContent).toBe('Loading');
    expect(recovery.getCacheRecoveryStatus()).toBe('loading');
    let deliverParticipants;
    client.markets.listUsers.mockReturnValueOnce(new Promise((resolve) => { deliverParticipants = resolve; }));
    let refresh;
    await act(async () => {
      refresh = sync.refreshVersionsOnce();
      await new Promise(jest.requireActual('timers').setImmediate);
    });
    expect(client.markets.listUsers).toHaveBeenCalledTimes(1);
    expect(container.textContent).toBe('Loading');
    expect(mockSetItem.mock.calls.some(([key]) => key === 'market_presences')).toBe(false);
    await act(async () => {
      deliverParticipants([{ ...user }]);
      await refresh;
      await freshness.waitForPendingWrites();
    });
    expect(container.textContent).toBe('Workspace loaded');
    expect(recovery.getCacheRecoveryStatus()).toBe('ready');
    expect(mockDisk.get('market_presences')[market.id]).toEqual([expect.objectContaining(user)]);
    expect(mockUnreadable.has('market_presences')).toBe(false);
    expect(mockDisk.get('market_context').marketDetails).toEqual([expect.objectContaining(market)]);
    expect(mockUnreadable.size).toBe(0);
    expect(mockGetItem.mock.calls.filter(([key]) => key === 'market_presences')).toHaveLength(1);
    expect(warnings.mock.calls.some(([message]) => message.includes('no current user'))).toBe(false);
    expect(errors).not.toHaveBeenCalled();
  });
});
