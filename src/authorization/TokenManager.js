/*
Class that manages the known tokens inside the system. It _does not_ manage identity's, but does
subscribe to new identities in order to use that identity to get new tokens
 */

import TokenStorageManager from './TokenStorageManager';

const TOKEN_TYPE_MARKET = 'MARKET';
const TOKEN_TYPE_ACCOUNT = 'ACCOUNT';
export { TOKEN_TYPE_ACCOUNT, TOKEN_TYPE_MARKET };

class TokenManager {

  constructor(identityProvider, ssoClient){
    this.ssoClient = ssoClient;
    this.identityProvider = identityProvider;
    this.tokenStorageManager = new TokenStorageManager();
  }

  requestToken(tokenType, itemId){
    const token = this.tokenStorageManager.getValidToken(tokenType, itemId);
    if (token) {
      return Promise.resolve(token);
    }
    // we don't have token, time to request a new one.
    return this.identityProvider.getIdentity()
      .then((identity) => {
        switch(tokenType){
          case TOKEN_TYPE_MARKET:
            return this.getMarketToken(identity, itemId);
          case TOKEN_TYPE_ACCOUNT:
            return this.getAccountToken(identity, itemId);
          default:
            throw new Error('Unknown token type');
        }
      });
  }

  getMarketToken(identity, marketId){
    return this.ssoClient.marketCognitoLogin(identity, marketId)
      .then((uclusionToken) => {
        this.tokenStorageManager.storeToken(TOKEN_TYPE_MARKET, uclusionToken);
        return uclusionToken;
      });

  }

  getAccountToken(identity, accountId){
    return this.ssoClient.accountCognitoLogin(identity, accountId)
      .then((uclusionToken) => {
        this.tokenStorageManager.storeToken(TOKEN_TYPE_ACCOUNT, uclusionToken);
        return uclusionToken;
      });
  }

  clearTokens() {
    this.tokenStorageManager.clearTokenStorage();
  }

}

export default TokenManager;
