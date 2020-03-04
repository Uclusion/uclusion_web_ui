import client from 'uclusion_sdk';
import config from '../config/config';
import TokenFetcher from '../authorization/TokenFetcher';
import { TOKEN_TYPE_ACCOUNT, TOKEN_TYPE_MARKET, TOKEN_TYPE_FILE } from '../authorization/TokenStorageManager';
import AmplifyIdentityTokenRefresher from '../authorization/AmplifyIdentityTokenRefresher';
import FileTokenRefresher from '../authorization/FileTokenRefresher';
import { updateFileToken } from '../authorization/tokenStorageUtils';

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

export const getAccountClient = () => {
  const ssoClient = client.constructSSOClient(config.api_configuration);
  return ssoClient.then((sso) => {
    const identitySource = new AmplifyIdentityTokenRefresher();
    const tokenManager = new TokenFetcher(identitySource, sso, TOKEN_TYPE_ACCOUNT, 'home_account');
    return tokenManager.getToken() // force login
      .then(() => client.constructClient({ ...config.api_configuration, tokenManager }));
  });
};



export const getFileClient = (metadata) => {
  const { path, uclusion_token } = metadata;
  // console.log(metadata);
  // since I have the token handy, I might as well update the storage with it;
  if (uclusion_token) {
    updateFileToken(path, uclusion_token);
  }
  // we MUST send the origin header, or the request will fail
  const tokenRefresher = new FileTokenRefresher();
  const tokenManager = new TokenFetcher(tokenRefresher, null, TOKEN_TYPE_FILE, path);
  const clientConfig = {
    ...config.file_download_configuration,
    tokenManager,
    responseAsBlob: true,
  };
  return client.constructFilesClient(clientConfig);
};
