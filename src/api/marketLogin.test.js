import MarketTokenFetcher from '../authorization/MarketTokenFetcher';
import { getMarketToken } from './marketLogin';

jest.mock('uclusion_sdk', () => ({
  constructClient: jest.fn(),
}));
jest.mock('../config/config', () => ({
  api_configuration: {},
}));
jest.mock('../authorization/MarketTokenFetcher');
jest.mock('./singletons', () => ({
  AMPLIFY_IDENTITY_SOURCE: 'identity-source',
  SSO_CLIENT: 'sso-client',
}));
jest.mock('../utils/userMessage', () => ({
  toastErrorAndThrow: jest.fn((error) => {
    throw error;
  }),
}));

describe('getMarketToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
});
