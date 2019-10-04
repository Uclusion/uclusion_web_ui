import client from 'uclusion_sdk';
import config from '../config/config';
import TokenManager from '../authorization/TokenManager';
import { TOKEN_TYPE_ACCOUNT, TOKEN_TYPE_MARKET, TOKEN_TYPE_FILE } from '../authorization/TokenStorageManager';
import AmplifyIdentityTokenRefresher from '../authorization/AmplifyIdentityTokenRefresher';
import FileTokenRefresher from '../authorization/FileTokenRefresher';
import { updateFileToken } from '../authorization/tokenStorageUtils';

export const getMarketClient = (marketId) => {
  const ssoClient = client.constructSSOClient(config.api_configuration);
  return ssoClient.then((sso) => {
    const identitySource = new AmplifyIdentityTokenRefresher();
    const tokenManager = new TokenManager(identitySource, sso, TOKEN_TYPE_MARKET, marketId);
    return tokenManager.getToken() // force login
      .then(() => client.constructClient({ ...config.api_configuration, tokenManager }));
  });
};

export const getAccountClient = () => {
  const ssoClient = client.constructSSOClient(config.api_configuration);
  return ssoClient.then((sso) => {
    const identitySource = new AmplifyIdentityTokenRefresher();
    const tokenManager = new TokenManager(identitySource, sso, TOKEN_TYPE_ACCOUNT, 'home_account');
    return tokenManager.getToken() // force login
      .then(() => client.constructClient({ ...config.api_configuration, tokenManager }));
  });
};

export const getFileClient = (metadata) => {
  const { path, uclusion_token } = metadata;
  console.log(metadata);
  // since I have the token handy, I might as well update the storage with it;
  updateFileToken(path, uclusion_token);
  const tokenRefresher = new FileTokenRefresher();
  const tokenManager = new TokenManager(tokenRefresher, null, TOKEN_TYPE_FILE, path);
  return client.constructFilesClient({ ...config.file_download_configuration, tokenManager });
};
