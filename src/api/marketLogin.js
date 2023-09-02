import client from 'uclusion_sdk'
import config from '../config/config'
import MarketTokenFetcher from '../authorization/MarketTokenFetcher'
import AmplifyIdentityTokenRefresher from '../authorization/AmplifyIdentityTokenRefresher'
import { AMPLIFY_IDENTITY_SOURCE, SSO_CLIENT } from './singletons';
import { TOKEN_TYPE_MARKET, TOKEN_TYPE_MARKET_INVITE } from './tokenConstants';
import { toastErrorAndThrow } from '../utils/userMessage';


export const getMarketClient = (marketId) => {
    const tokenManager = new MarketTokenFetcher(AMPLIFY_IDENTITY_SOURCE, SSO_CLIENT, TOKEN_TYPE_MARKET, marketId);
    return tokenManager.getToken() // force login
      .then(() => client.constructClient({ ...config.api_configuration, tokenManager }))
      .catch((error) => toastErrorAndThrow(error, 'errorMarketLoginFailed'));
};

export const getMarketLogin = (marketId) => {
  const tokenManager = new MarketTokenFetcher(AMPLIFY_IDENTITY_SOURCE, SSO_CLIENT, TOKEN_TYPE_MARKET, marketId);
  return tokenManager.getIdentityBasedTokenAndInfo();
};

export const getMarketFromInvite = (marketToken) => {
  const tokenManager = new MarketTokenFetcher(AMPLIFY_IDENTITY_SOURCE, SSO_CLIENT, TOKEN_TYPE_MARKET_INVITE, marketToken);
  return tokenManager.getIdentityBasedTokenAndInfo();
};

export const getMarketFromUrl = (marketId) => {
  console.info(`Attempting to load ${marketId}`);
  const ssoClient = client.constructSSOClient(config.api_configuration);
  return ssoClient.then((sso) => {
    const identitySource = new AmplifyIdentityTokenRefresher();
    const tokenManager = new MarketTokenFetcher(identitySource, sso, TOKEN_TYPE_MARKET, marketId);
    return tokenManager.getIdentityBasedTokenAndInfo();
  });
};
