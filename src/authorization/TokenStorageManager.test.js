import LocalForageHelper from '../utils/LocalForageHelper';
import { pushMessage } from '../utils/MessageBusUtils';
import {
  getLogoutGeneration,
  isLogoutGenerationCurrent,
  isSignedOut,
} from '../utils/logoutState';
import TokenStorageManager, { TokenWriteCancelledError } from './TokenStorageManager';
import { LOAD_EVENT, LOAD_TOKENS_CHANNEL } from '../contexts/MarketsContext/marketsContextMessages';
import { TOKEN_STORAGE_KEYSPACE, TOKEN_TYPE_MARKET } from '../api/tokenConstants';

jest.mock('../utils/LocalForageHelper');
jest.mock('../utils/MessageBusUtils', () => ({
  pushMessage: jest.fn(),
}));
jest.mock('../utils/logoutState', () => ({
  getLogoutGeneration: jest.fn(),
  isLogoutGenerationCurrent: jest.fn(),
  isSignedOut: jest.fn(),
}));

describe('TokenStorageManager guarded writes', () => {
  const key = `${TOKEN_TYPE_MARKET}_market-id`;
  const writeLock = `token_write_${key}`;
  let deleteState;
  let setState;
  let lockRequest;
  let storageManager;

  beforeEach(() => {
    jest.clearAllMocks();
    deleteState = jest.fn().mockResolvedValue();
    setState = jest.fn().mockResolvedValue('market-token');
    LocalForageHelper.mockImplementation(() => ({ deleteState, setState }));
    getLogoutGeneration.mockReturnValue(1);
    isLogoutGenerationCurrent.mockImplementation((generation) => generation === 1);
    isSignedOut.mockReturnValue(false);
    lockRequest = jest.fn((_name, callback) => callback());
    Object.defineProperty(window.navigator, 'locks', {
      configurable: true,
      value: { request: lockRequest },
    });
    storageManager = new TokenStorageManager();
  });

  it('cancels before persistence when the activity guard has expired', async () => {
    const activityGuard = jest.fn().mockReturnValue(false);

    await expect(storageManager.storeToken(
      TOKEN_TYPE_MARKET, 'market-id', 'market-token', activityGuard
    )).rejects.toBeInstanceOf(TokenWriteCancelledError);

    expect(lockRequest).toHaveBeenCalledWith(writeLock, expect.any(Function));
    expect(setState).not.toHaveBeenCalled();
    expect(deleteState).not.toHaveBeenCalled();
    expect(pushMessage).not.toHaveBeenCalled();
  });

  it('cancels an unguarded write while signed out', async () => {
    isSignedOut.mockReturnValue(true);

    await expect(storageManager.storeToken(
      TOKEN_TYPE_MARKET, 'market-id', 'market-token'
    )).rejects.toMatchObject({ cancelled: true });

    expect(setState).not.toHaveBeenCalled();
    expect(pushMessage).not.toHaveBeenCalled();
  });

  it('cancels a write captured before the current logout generation', async () => {
    isLogoutGenerationCurrent.mockReturnValue(false);

    await expect(storageManager.storeToken(
      TOKEN_TYPE_MARKET, 'market-id', 'market-token', undefined, 0
    )).rejects.toMatchObject({ cancelled: true });

    expect(setState).not.toHaveBeenCalled();
    expect(pushMessage).not.toHaveBeenCalled();
  });

  it('removes a persisted token without publishing when the guard expires during the write', async () => {
    const activityGuard = jest.fn()
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);

    await expect(storageManager.storeToken(
      TOKEN_TYPE_MARKET, 'market-id', 'market-token', activityGuard
    )).rejects.toMatchObject({ cancelled: true });

    expect(setState).toHaveBeenCalledWith('market-token');
    expect(deleteState).toHaveBeenCalledTimes(1);
    expect(pushMessage).not.toHaveBeenCalled();
  });

  it('preserves cancellation when stale-token cleanup fails', async () => {
    const cleanupError = new Error('storage unavailable');
    deleteState.mockRejectedValue(cleanupError);
    const activityGuard = jest.fn()
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);

    await expect(storageManager.storeToken(
      TOKEN_TYPE_MARKET, 'market-id', 'market-token', activityGuard
    )).rejects.toMatchObject({ cancelled: true, cleanupError });

    expect(deleteState).toHaveBeenCalledTimes(1);
    expect(pushMessage).not.toHaveBeenCalled();
  });

  it('stores and publishes a token only after the final active guard', async () => {
    const order = [];
    const activityGuard = jest.fn(() => {
      order.push('guard');
      return true;
    });
    setState.mockImplementation(() => {
      order.push('store');
      return Promise.resolve('market-token');
    });
    pushMessage.mockImplementation(() => order.push('publish'));

    await expect(storageManager.storeToken(
      TOKEN_TYPE_MARKET, 'market-id', 'market-token', activityGuard
    )).resolves.toBe('market-token');

    expect(LocalForageHelper).toHaveBeenCalledWith(key, TOKEN_STORAGE_KEYSPACE);
    expect(order).toEqual(['guard', 'store', 'guard', 'publish']);
    expect(pushMessage).toHaveBeenCalledWith(LOAD_TOKENS_CHANNEL, {
      event: LOAD_EVENT,
      key,
      token: 'market-token',
    });
    expect(deleteState).not.toHaveBeenCalled();
  });

  it('uses the same distinct write lock for token deletion', async () => {
    await storageManager.deleteToken(TOKEN_TYPE_MARKET, 'market-id');

    expect(lockRequest).toHaveBeenCalledWith(writeLock, expect.any(Function));
    expect(deleteState).toHaveBeenCalledTimes(1);
  });

  it('finishes stale cleanup before a queued newer writer runs', async () => {
    const order = [];
    let resolveOldWrite;
    const oldWrite = new Promise((resolve) => {
      resolveOldWrite = resolve;
    });
    const oldStorage = {
      setState: jest.fn(() => {
        order.push('old store');
        return oldWrite;
      }),
      deleteState: jest.fn(() => {
        order.push('old delete');
        return Promise.resolve();
      }),
    };
    const newStorage = {
      setState: jest.fn(() => {
        order.push('new store');
        return Promise.resolve('new-token');
      }),
      deleteState: jest.fn(),
    };
    LocalForageHelper
      .mockImplementationOnce(() => oldStorage)
      .mockImplementationOnce(() => newStorage);
    const lockTails = new Map();
    lockRequest.mockImplementation((name, callback) => {
      const previous = lockTails.get(name) || Promise.resolve();
      const current = previous.then(callback, callback);
      lockTails.set(name, current.catch(() => undefined));
      return current;
    });
    const staleGuard = jest.fn()
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);
    pushMessage.mockImplementation((_channel, message) => order.push(`publish ${message.token}`));

    const stalePromise = storageManager.storeToken(
      TOKEN_TYPE_MARKET, 'market-id', 'old-token', staleGuard
    );
    const currentPromise = storageManager.storeToken(
      TOKEN_TYPE_MARKET, 'market-id', 'new-token', () => true
    );
    await Promise.resolve();
    resolveOldWrite('old-token');

    await expect(stalePromise).rejects.toMatchObject({ cancelled: true });
    await expect(currentPromise).resolves.toBe('new-token');

    expect(order).toEqual([
      'old store',
      'old delete',
      'new store',
      'publish new-token',
    ]);
    expect(newStorage.deleteState).not.toHaveBeenCalled();
  });
});
