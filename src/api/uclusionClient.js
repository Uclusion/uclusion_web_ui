import client from 'uclusion_sdk';
import config from '../config/config';
import TokenManager, { TOKEN_TYPE_ACCOUNT, TOKEN_TYPE_MARKET, TOKEN_TYPE_FILE } from '../authorization/TokenManager';
import AmplifyIdentitySource from '../authorization/AmplifyIdentitySource';
import NullIdentitySource from '../authorization/NullIdentitySource';
import { updateFileToken } from '../authorization/tokenStorageUtils';

export const getMarketClient = (marketId) => {
  const ssoClient = client.constructSSOClient(config.api_configuration);
  return ssoClient.then((sso) => {
    const identitySource = new AmplifyIdentitySource();
    const tokenManager = new TokenManager(identitySource, sso, TOKEN_TYPE_MARKET, marketId);
    return tokenManager.getToken() // force login
      .then(() => client.constructClient({ ...config.api_configuration, tokenManager }));
  });
};

export const getAccountClient = () => {
  const ssoClient = client.constructSSOClient(config.api_configuration);
  return ssoClient.then((sso) => {
    const identitySource = new AmplifyIdentitySource();
    const tokenManager = new TokenManager(identitySource, sso, TOKEN_TYPE_ACCOUNT, 'home_account');
    return tokenManager.getToken() // force login
      .then(() => client.constructClient({ ...config.api_configuration, tokenManager }));
  });
};

export const getFileClient = (metadata) => {
  const { path, uclusion_token } = metadata;
  // since I have the token handy, I might as well update the storage with it;
  updateFileToken(path, uclusion_token);
  const ssoClient = client.constructSSOClient(config.api_configuration);
  return ssoClient.then((sso) => {
    const nullIdentitySource = new NullIdentitySource();
    const tokenManager = new TokenManager(nullIdentitySource, sso, TOKEN_TYPE_FILE, path);
    return tokenManager.getToken()
      .then(() => client.constructClient({ ...config.api_configuration, tokenManager }));
  });
};
