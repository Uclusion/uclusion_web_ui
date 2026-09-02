import { getTokenStorageManager } from '../api/singletons';
import { TOKEN_TYPE_MARKET } from '../api/tokenConstants';
import {
  getLogoutGeneration,
  isLogoutGenerationCurrent,
  isSignedOut,
} from '../utils/logoutState';
import MarketTokenFetcher from './MarketTokenFetcher';

jest.mock('../api/singletons', () => ({
  getTokenStorageManager: jest.fn(),
}));
jest.mock('../utils/logoutState', () => ({
  getLogoutGeneration: jest.fn(),
  isLogoutGenerationCurrent: jest.fn(),
  isSignedOut: jest.fn(),
}));

describe('MarketTokenFetcher guarded login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getLogoutGeneration.mockReturnValue(1);
    isLogoutGenerationCurrent.mockReturnValue(true);
    isSignedOut.mockReturnValue(false);
    Object.defineProperty(window.navigator, 'locks', {
      configurable: true,
      value: { request: jest.fn((_name, callback) => callback()) },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not return login data when its guarded token write is declined', async () => {
    const cancellation = Object.assign(new Error('cancelled'), { cancelled: true });
    const storeToken = jest.fn().mockRejectedValue(cancellation);
    const tokenRefresher = { getIdentity: jest.fn().mockResolvedValue('identity') };
    const ssoClient = {
      marketCognitoLogin: jest.fn().mockResolvedValue({
        market: { id: 'market-id' },
        uclusion_token: 'market-token',
      }),
    };
    const activityGuard = jest.fn(() => false);
    getTokenStorageManager.mockReturnValue({ storeToken });
    const fetcher = new MarketTokenFetcher(
      tokenRefresher, ssoClient, TOKEN_TYPE_MARKET, 'market-id'
    );

    await expect(fetcher.getIdentityBasedTokenAndInfo(activityGuard)).rejects.toBe(cancellation);

    expect(storeToken).toHaveBeenCalledWith(
      TOKEN_TYPE_MARKET, 'market-id', 'market-token', activityGuard, 1
    );
  });

  it('invalidates a request begun before a rapid logout and later login', async () => {
    let currentGeneration = 4;
    let resolveIdentity;
    const identity = new Promise((resolve) => {
      resolveIdentity = resolve;
    });
    getLogoutGeneration.mockImplementation(() => currentGeneration);
    isLogoutGenerationCurrent.mockImplementation((generation) => {
      return generation === currentGeneration;
    });
    const storeToken = jest.fn((
      _tokenType, _marketId, _token, _activityGuard, capturedGeneration
    ) => {
      return Promise.resolve(capturedGeneration);
    });
    getTokenStorageManager.mockReturnValue({ storeToken });
    const fetcher = new MarketTokenFetcher(
      { getIdentity: jest.fn(() => identity) },
      { marketCognitoLogin: jest.fn().mockResolvedValue({ uclusion_token: 'market-token' }) },
      TOKEN_TYPE_MARKET,
      'market-id'
    );

    const loginPromise = fetcher.getIdentityBasedTokenAndInfo();
    expect(getLogoutGeneration).toHaveBeenCalledTimes(1);
    currentGeneration = 5;
    resolveIdentity('identity-a');

    await expect(loginPromise).rejects.toMatchObject({ cancelled: true });
    expect(storeToken).not.toHaveBeenCalled();
  });

  it('captures the generation before a directly invoked market login request', async () => {
    let currentGeneration = 10;
    let resolveLogin;
    const login = new Promise((resolve) => {
      resolveLogin = resolve;
    });
    const cancellation = Object.assign(new Error('cancelled'), { cancelled: true });
    getLogoutGeneration.mockImplementation(() => currentGeneration);
    const storeToken = jest.fn((
      _tokenType, _marketId, _token, _activityGuard, capturedGeneration
    ) => {
      return capturedGeneration === currentGeneration
        ? Promise.resolve('market-token')
        : Promise.reject(cancellation);
    });
    getTokenStorageManager.mockReturnValue({ storeToken });
    const fetcher = new MarketTokenFetcher(
      { getIdentity: jest.fn() },
      { marketCognitoLogin: jest.fn(() => login) },
      TOKEN_TYPE_MARKET,
      'market-id'
    );

    const loginPromise = fetcher.getMarketTokenAndLoginData('identity-a', 'market-id');
    currentGeneration = 11;
    resolveLogin({ uclusion_token: 'market-token' });

    await expect(loginPromise).rejects.toBe(cancellation);
    expect(storeToken).toHaveBeenCalledWith(
      TOKEN_TYPE_MARKET, 'market-id', 'market-token', undefined, 10
    );
  });

  it('does not return a cached token after rapid logout and login', async () => {
    let currentGeneration = 'user-a';
    let resolveCachedToken;
    const cachedToken = new Promise((resolve) => {
      resolveCachedToken = resolve;
    });
    getLogoutGeneration.mockImplementation(() => currentGeneration);
    isLogoutGenerationCurrent.mockImplementation((generation) => {
      return generation === currentGeneration;
    });
    const tokenStorageManager = {
      getValidToken: jest.fn(() => cachedToken),
    };
    getTokenStorageManager.mockReturnValue(tokenStorageManager);
    const tokenRefresher = { getIdentity: jest.fn() };
    const fetcher = new MarketTokenFetcher(
      tokenRefresher, {}, TOKEN_TYPE_MARKET, 'market-id'
    );

    const tokenPromise = fetcher.getToken();
    currentGeneration = 'user-b';
    resolveCachedToken('user-a-token');

    await expect(tokenPromise).rejects.toMatchObject({ cancelled: true });
    expect(tokenRefresher.getIdentity).not.toHaveBeenCalled();
  });

  it('invalidates a whole expiring-token refresh after logout and login', async () => {
    let currentGeneration = 'user-a';
    let resolveExpiringTokens;
    const expiringTokens = new Promise((resolve) => {
      resolveExpiringTokens = resolve;
    });
    getLogoutGeneration.mockImplementation(() => currentGeneration);
    isLogoutGenerationCurrent.mockImplementation((generation) => {
      return generation === currentGeneration;
    });
    const tokenStorageManager = {
      getExpiringTokens: jest.fn(() => expiringTokens),
    };
    getTokenStorageManager.mockReturnValue(tokenStorageManager);
    const tokenRefresher = { getIdentity: jest.fn() };
    const fetcher = new MarketTokenFetcher(
      tokenRefresher, {}, TOKEN_TYPE_MARKET
    );

    const refreshPromise = fetcher.refreshExpiringTokens(72);
    currentGeneration = 'user-b';
    resolveExpiringTokens(['market-id']);

    await expect(refreshPromise).rejects.toMatchObject({ cancelled: true });
    expect(tokenRefresher.getIdentity).not.toHaveBeenCalled();
  });

  it('silences and consumes a logout that starts during periodic refresh', async () => {
    let resolveIdentity;
    let markIdentityStarted;
    const identity = new Promise((resolve) => {
      resolveIdentity = resolve;
    });
    const identityStarted = new Promise((resolve) => {
      markIdentityStarted = resolve;
    });
    const tokenStorageManager = {
      getExpiringTokens: jest.fn().mockResolvedValue(['market-a', 'market-b']),
      storeToken: jest.fn(),
    };
    const tokenRefresher = {
      getIdentity: jest.fn(() => {
        markIdentityStarted();
        return identity;
      }),
    };
    const ssoClient = { marketCognitoLogin: jest.fn() };
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    getTokenStorageManager.mockReturnValue(tokenStorageManager);
    const fetcher = new MarketTokenFetcher(
      tokenRefresher, ssoClient, TOKEN_TYPE_MARKET
    );

    const refreshPromise = fetcher.refreshExpiringTokens(72);
    await identityStarted;
    isSignedOut.mockReturnValue(true);
    resolveIdentity('identity');

    await expect(refreshPromise).resolves.toEqual([]);
    expect(consoleError).not.toHaveBeenCalled();
    expect(tokenRefresher.getIdentity).toHaveBeenCalledTimes(1);
    expect(ssoClient.marketCognitoLogin).not.toHaveBeenCalled();
    expect(tokenStorageManager.storeToken).not.toHaveBeenCalled();
  });

  it('reports and omits a signed-in periodic failure before continuing', async () => {
    const error = new Error('identity failed');
    const tokenStorageManager = {
      getExpiringTokens: jest.fn().mockResolvedValue(['market-a', 'market-b']),
      storeToken: jest.fn().mockResolvedValue(),
    };
    const tokenRefresher = {
      getIdentity: jest.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('identity'),
    };
    const ssoClient = {
      marketCognitoLogin: jest.fn().mockResolvedValue({ uclusion_token: 'market-token' }),
    };
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    getTokenStorageManager.mockReturnValue(tokenStorageManager);
    const fetcher = new MarketTokenFetcher(
      tokenRefresher, ssoClient, TOKEN_TYPE_MARKET
    );

    await expect(fetcher.refreshExpiringTokens(72)).resolves.toEqual(['market-token']);

    expect(consoleError).toHaveBeenCalledWith(error);
    expect(tokenRefresher.getIdentity).toHaveBeenCalledTimes(2);
    expect(ssoClient.marketCognitoLogin).toHaveBeenCalledWith('identity', 'market-b');
  });

  it('keeps a marker-read failure from escaping the periodic error boundary', async () => {
    const markerError = new Error('invalid marker storage');
    const refreshError = new Error('identity failed');
    let markerReadFails = false;
    isSignedOut.mockImplementation(() => {
      if (markerReadFails) {
        throw markerError;
      }
      return false;
    });
    const tokenStorageManager = {
      getExpiringTokens: jest.fn().mockResolvedValue(['market-a']),
    };
    const tokenRefresher = {
      getIdentity: jest.fn(() => {
        markerReadFails = true;
        return Promise.reject(refreshError);
      }),
    };
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    getTokenStorageManager.mockReturnValue(tokenStorageManager);
    const fetcher = new MarketTokenFetcher(
      tokenRefresher, {}, TOKEN_TYPE_MARKET
    );

    await expect(fetcher.refreshExpiringTokens(72)).resolves.toEqual([]);

    expect(consoleError).toHaveBeenCalledWith(refreshError);
  });
});
