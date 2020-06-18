import client from 'uclusion_sdk'
import config from '../config/config'
import TokenFetcher from '../authorization/TokenFetcher'
import { TOKEN_TYPE_ACCOUNT, TOKEN_TYPE_MARKET, TOKEN_TYPE_MARKET_INVITE } from '../authorization/TokenStorageManager'
import AmplifyIdentityTokenRefresher from '../authorization/AmplifyIdentityTokenRefresher'

export const getMarketClient = (marketId, isObserver) => {
  const ssoClient = client.constructSSOClient(config.api_configuration);
  return ssoClient.then((sso) => {
    const identitySource = new AmplifyIdentityTokenRefresher();
    const tokenManager = new TokenFetcher(identitySource, sso, TOKEN_TYPE_MARKET, marketId, isObserver);
    return tokenManager.getToken() // force login
      .then(() => client.constructClient({ ...config.api_configuration, tokenManager }));
  });
};

export const getMarketLogin = (marketId, isObserver) => {
  const ssoClient = client.constructSSOClient(config.api_configuration);
  return ssoClient.then((sso) => {
    const identitySource = new AmplifyIdentityTokenRefresher();
    const tokenManager = new TokenFetcher(identitySource, sso, TOKEN_TYPE_MARKET, marketId, isObserver);
    return tokenManager.getIdentityBasedTokenAndInfo(isObserver);
  });
};

export const getMarketFromInvite = (marketToken, isObserver) => {
  const ssoClient = client.constructSSOClient(config.api_configuration);
  return ssoClient.then((sso) => {
    const identitySource = new AmplifyIdentityTokenRefresher();
    const tokenManager = new TokenFetcher(identitySource, sso, TOKEN_TYPE_MARKET_INVITE, marketToken, isObserver);
    return tokenManager.getIdentityBasedTokenAndInfo(isObserver);
  });
};

export const getMarketFromUrl = (marketId) => {
  const ssoClient = client.constructSSOClient(config.api_configuration);
  return ssoClient.then((sso) => {
    const identitySource = new AmplifyIdentityTokenRefresher();
    const tokenManager = new TokenFetcher(identitySource, sso, TOKEN_TYPE_MARKET, marketId, true);
    return tokenManager.getIdentityBasedTokenAndInfo(true);
  });
};

export const getAccountClient = () => {
  const ssoClient = client.constructSSOClient(config.api_configuration);
  return ssoClient.then((sso) => {
    const identitySource = new AmplifyIdentityTokenRefresher();
    const tokenManager = new TokenFetcher(identitySource, sso, TOKEN_TYPE_ACCOUNT, 'home_account');
    return tokenManager.getToken() // force login
      .then(() => client.constructClient({ ...config.api_configuration, tokenManager }));
  });
};
