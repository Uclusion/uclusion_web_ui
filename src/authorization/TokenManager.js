/*
Class that manages the tokens for a particular type and market.
It _does not_ manage identity's, but does
ask the identity source for new identities when needed
 */

import TokenStorageManager from './TokenStorageManager';
import uclusion from 'uclusion_sdk';

const TOKEN_TYPE_MARKET = 'MARKET';
const TOKEN_TYPE_ACCOUNT = 'ACCOUNT';
const TOKEN_TYPE_FILE = 'FILE';
export { TOKEN_TYPE_ACCOUNT, TOKEN_TYPE_MARKET, TOKEN_TYPE_FILE };

class TokenManager {

  constructor(identitySource, ssoClient, tokenType, itemId) {
    this.ssoClient = ssoClient;
    this.identitySource = identitySource;
    this.tokenStorageManager = new TokenStorageManager();
    this.tokenType = tokenType;
    this.itemId = itemId;
  }

  getToken() {
    const token = this.tokenStorageManager.getValidToken(this.tokenType, this.itemId);
    if (token) {
      return Promise.resolve(token);
    }
    // For identity based tokens time to request a new one.
    return this.identitySource.getIdentity()
      .then((identity) => {
        switch(this.tokenType){
          case TOKEN_TYPE_MARKET:
            return this.getMarketToken(identity, this.itemId);
          case TOKEN_TYPE_ACCOUNT:
            return this.getAccountToken(identity, this.itemId);
          default:
            throw new Error('Unknown token type');
        }
      });
  }

  getMarketToken(identity, marketId){
    return this.ssoClient.marketCognitoLogin(identity, marketId)
      .then((loginData) => {
        const { uclusion_token } = loginData;
        this.tokenStorageManager.storeToken(TOKEN_TYPE_MARKET, marketId, uclusion_token);
        return uclusion_token;
      });

  }

  getAccountToken(identity, accountId){
    return this.ssoClient.accountCognitoLogin(identity, accountId)
      .then((loginData) => {
        const { uclusion_token } = loginData;
        this.tokenStorageManager.storeToken(TOKEN_TYPE_ACCOUNT, accountId, uclusion_token);
        return uclusion_token;
      });
  }

  clearTokens() {
    this.tokenStorageManager.clearTokenStorage();
  }

}

export default TokenManager;
