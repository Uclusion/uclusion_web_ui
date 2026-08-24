import MarketTokenFetcher from '../authorization/MarketTokenFetcher';
import AmplifyIdentityTokenRefresher from '../authorization/AmplifyIdentityTokenRefresher';
import uclusion from 'uclusion_sdk';
import { getMarketFromUrl, getMarketToken } from './marketLogin';

jest.mock('uclusion_sdk', () => ({
  constructClient: jest.fn(),
  constructSSOClient: jest.fn(),
}));
jest.mock('../config/config', () => ({
  api_configuration: {},
}));
jest.mock('../authorization/MarketTokenFetcher');
jest.mock('../authorization/AmplifyIdentityTokenRefresher');
jest.mock('./singletons', () => ({
  AMPLIFY_IDENTITY_SOURCE: 'identity-source',
  SSO_CLIENT: 'sso-client',
}));
jest.mock('../utils/userMessage', () => ({
  toastErrorAndThrow: jest.fn((error) => {
    throw error;
  }),
}));
jest.mock('../utils/logoutState', () => ({
  getLogoutGeneration: jest.fn(),
  isLogoutGenerationCurrent: jest.fn(),
  isSignedOut: jest.fn(),
}));

const {
  getLogoutGeneration,
  isLogoutGenerationCurrent,
  isSignedOut,
} = jest.requireMock('../utils/logoutState');

describe('getMarketToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getLogoutGeneration.mockReturnValue('session-a');
    isLogoutGenerationCurrent.mockImplementation((generation) => generation === 'session-a');
    isSignedOut.mockReturnValue(false);
    uclusion.constructSSOClient.mockResolvedValue('constructed-sso');
  });

  it('returns the cached or refreshed token for the requested market', async () => {
    const getToken = jest.fn().mockResolvedValue('market-token');
    MarketTokenFetcher.mockImplementation(() => ({ getToken }));

    await expect(getMarketToken('market-id')).resolves.toBe('market-token');

    expect(MarketTokenFetcher).toHaveBeenCalledWith(
      'identity-source',
      'sso-client',
      'MARKET',
      'market-id'
    );
    expect(getToken).toHaveBeenCalledTimes(1);
  });

  it('forwards the activity guard through URL-based market login', async () => {
    const loginData = { market: { id: 'market-id' }, uclusion_token: 'market-token' };
    const getIdentityBasedTokenAndInfo = jest.fn().mockResolvedValue(loginData);
    const activityGuard = jest.fn(() => true);
    MarketTokenFetcher.mockImplementation(() => ({ getIdentityBasedTokenAndInfo }));

    await expect(getMarketFromUrl('market-id', activityGuard)).resolves.toBe(loginData);

    expect(AmplifyIdentityTokenRefresher).toHaveBeenCalledTimes(1);
    expect(MarketTokenFetcher).toHaveBeenCalledWith(
      expect.anything(),
      'constructed-sso',
      'MARKET',
      'market-id'
    );
    expect(getIdentityBasedTokenAndInfo).toHaveBeenCalledWith(expect.any(Function));
    expect(getIdentityBasedTokenAndInfo.mock.calls[0][0]()).toBe(true);
    expect(activityGuard).toHaveBeenCalled();
  });

  it('cancels a URL login whose SSO construction spans logout and login', async () => {
    let currentGeneration = 'session-a';
    let finishSSOConstruction;
    const ssoConstruction = new Promise((resolve) => {
      finishSSOConstruction = resolve;
    });
    getLogoutGeneration.mockImplementation(() => currentGeneration);
    isLogoutGenerationCurrent.mockImplementation(
      (generation) => generation === currentGeneration
    );
    uclusion.constructSSOClient.mockReturnValue(ssoConstruction);

    const login = getMarketFromUrl('market-id');
    currentGeneration = 'session-b';
    finishSSOConstruction('constructed-sso');

    await expect(login).rejects.toMatchObject({ cancelled: true });
    expect(MarketTokenFetcher).not.toHaveBeenCalled();
  });
});
