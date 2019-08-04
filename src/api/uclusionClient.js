import client from 'uclusion_sdk';
import config from '../config/config';
import TokenManager, { TOKEN_TYPE_ACCOUNT, TOKEN_TYPE_MARKET } from '../authorization/TokenManager';
import AmplifyIdentitySource from '../authorization/AmplifyIdentitySource';

export const getMarketClient = (marketId) => {
  const ssoClient = client.constructSSOClient(config.api_configuration);
  return ssoClient.then((sso) => {
    const identitySource = new AmplifyIdentitySource();
    const tokenManager = new TokenManager(identitySource, sso, TOKEN_TYPE_MARKET, marketId);
    return client.constructClient({ ...config.api_configuration, tokenManager });
  });
};

export const getAccountClient = (accountId) => {
  const ssoClient = client.constructSSOClient(config.api_configuration);
  return ssoClient.then((sso) => {
    const identitySource = new AmplifyIdentitySource();
    const tokenManager = new TokenManager(identitySource, sso, TOKEN_TYPE_ACCOUNT, accountId);
    return client.constructClient({ ...config.api_configuration, tokenManager });
  });
};
