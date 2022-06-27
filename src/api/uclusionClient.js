import client from 'uclusion_sdk'
import config from '../config/config'
import TokenFetcher from '../authorization/TokenFetcher'
import { TOKEN_TYPE_ACCOUNT, TOKEN_TYPE_MARKET, TOKEN_TYPE_MARKET_INVITE } from '../authorization/TokenStorageManager'
import AmplifyIdentityTokenRefresher from '../authorization/AmplifyIdentityTokenRefresher'

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
  const ssoClient = client.constructSSOClient(config.api_configuration);
  return ssoClient.then((sso) => {
    const identitySource = new AmplifyIdentityTokenRefresher();
    const tokenManager = new TokenFetcher(identitySource, sso, TOKEN_TYPE_ACCOUNT, 'home_account');
    return tokenManager.getToken()
      .then((accountToken) => {
        return { ssoClient: sso, accountToken };
      });
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

export const getTokenFetcher = (tokenType) => {
  const ssoClient = client.constructSSOClient(config.api_configuration);
  return ssoClient.then((sso) => {
    const identitySource = new AmplifyIdentityTokenRefresher();
    return new TokenFetcher(identitySource, sso, tokenType);
  });
}