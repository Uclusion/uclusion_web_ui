import client from 'uclusion_sdk'
import config from '../config/config'
import TokenFetcher from '../authorization/TokenFetcher'
import { TOKEN_TYPE_ACCOUNT, TOKEN_TYPE_MARKET, TOKEN_TYPE_MARKET_INVITE } from '../authorization/TokenStorageManager'
import AmplifyIdentityTokenRefresher from '../authorization/AmplifyIdentityTokenRefresher'

const AMPLIFY_IDENTITY_SOURCE = new AmplifyIdentityTokenRefresher();
const ACCOUNT_TOKEN_FETCHER = new TokenFetcher(AMPLIFY_IDENTITY_SOURCE, SSO_CLIENT, TOKEN_TYPE_ACCOUNT, 'home_account');

const SSO_CLIENT = client.getResolvedSSOClient(config.api_configuration);
export const MARKET_TOKEN_FETCHER = new TokenFetcher(AMPLIFY_IDENTITY_SOURCE, SSO_CLIENT, TOKEN_TYPE_MARKET);

export const getMarketClient = (marketId) => {
  const ssoClient = client.constructSSOClient(config.api_configuration);
  return ssoClient.then((sso) => {
    const identitySource = new AmplifyIdentityTokenRefresher();
    const tokenManager = new TokenFetcher(identitySource, sso, TOKEN_TYPE_MARKET, marketId);
    return tokenManager.getToken() // force login
      .then(() => client.constructClient({ ...config.api_configuration, tokenManager }));
  });
};

export const getMarketLogin = (marketId) => {
  const ssoClient = client.constructSSOClient(config.api_configuration);
  return ssoClient.then((sso) => {
    const identitySource = new AmplifyIdentityTokenRefresher();
    const tokenManager = new TokenFetcher(identitySource, sso, TOKEN_TYPE_MARKET, marketId);
    return tokenManager.getIdentityBasedTokenAndInfo();
  });
};

export const getMarketFromInvite = (marketToken) => {
  const ssoClient = client.constructSSOClient(config.api_configuration);
  return ssoClient.then((sso) => {
    const identitySource = new AmplifyIdentityTokenRefresher();
    const tokenManager = new TokenFetcher(identitySource, sso, TOKEN_TYPE_MARKET_INVITE, marketToken);
    return tokenManager.getIdentityBasedTokenAndInfo();
  });
};

export const getMarketFromUrl = (marketId) => {
  console.info(`Attempting to load ${marketId}`);
  const ssoClient = client.constructSSOClient(config.api_configuration);
  return ssoClient.then((sso) => {
    const identitySource = new AmplifyIdentityTokenRefresher();
    const tokenManager = new TokenFetcher(identitySource, sso, TOKEN_TYPE_MARKET, marketId);
    return tokenManager.getIdentityBasedTokenAndInfo();
  });
};

export const getAccountSSOClient = () => {
    return ACCOUNT_TOKEN_FETCHER.getToken() // force login and prime the pump
      .then((accountToken) => {
        return { ssoClient: SSO_CLIENT, accountToken };
      });
}

export const getAccountClient = () => {
    return ACCOUNT_TOKEN_FETCHER.getToken() // force login and prime the pump
      .then(() => client.constructClient({ ...config.api_configuration, tokenManager: ACCOUNT_TOKEN_FETCHER }));
};
