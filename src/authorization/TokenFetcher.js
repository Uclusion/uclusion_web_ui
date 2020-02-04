/*
Class that manages the tokens for a particular type and market.
It _does not_ manage identity's, but does
ask the identity source for new identities when needed
 */
import TokenStorageManager, { TOKEN_TYPE_ACCOUNT, TOKEN_TYPE_MARKET, TOKEN_TYPE_FILE } from './TokenStorageManager';

class TokenFetcher {

  constructor(tokenRefresher, ssoClient, tokenType, itemId, isObserver) {
    this.ssoClient = ssoClient;
    this.tokenRefresher = tokenRefresher;
    this.tokenStorageManager = new TokenStorageManager();
    this.tokenType = tokenType;
    this.itemId = itemId;
    this.isObserver = isObserver;
  }

  getToken() {
    const token = this.tokenStorageManager.getValidToken(this.tokenType, this.itemId);
    if (token) {
      return Promise.resolve(token);
    }
    if (this.tokenType === TOKEN_TYPE_MARKET || this.tokenType === TOKEN_TYPE_ACCOUNT) {
      return this.getIdentityBasedToken(this.isObserver);
    }
    if (this.tokenType === TOKEN_TYPE_FILE) {
      return this.refreshFileToken();
    }

    throw new Error('Can\'t refresh your token because I don\'t know how');
  }

  /**
   * Refreshes a file token for the given item id
   * Note this dies if there is no existing token in the system
   * or we can't get a token for the market that issued the file token
   */
  refreshFileToken() {
    const oldToken = this.tokenStorageManager.getToken(this.tokenType, this.itemId);
    this.tokenRefresher.refreshToken(oldToken)
      .then((result) => {
        const { uclusion_token } = result;
        this.tokenStorageManager.storeToken(TOKEN_TYPE_FILE, this.itemId, uclusion_token);
        return uclusion_token;
      });
  }

  getIdentityBasedToken(isObserver) {
    return this.tokenRefresher.getIdentity()
      .then((identity) => {
        switch(this.tokenType){
          case TOKEN_TYPE_MARKET:
            return this.getMarketToken(identity, this.itemId, isObserver);
          case TOKEN_TYPE_ACCOUNT:
            return this.getAccountToken(identity, this.itemId);
          default:
            throw new Error('Unknown token type');
        }
      });
  }

  getIdentityBasedTokenAndInfo(isObserver) {
    return this.tokenRefresher.getIdentity()
      .then((identity) => {
        switch(this.tokenType){
          case TOKEN_TYPE_MARKET:
            return this.getMarketTokenAndLoginData(identity, this.itemId, isObserver);
          case TOKEN_TYPE_ACCOUNT:
            return this.getAccountToken(identity, this.itemId);
          default:
            throw new Error('Unknown token type');
        }
      });
  }

  getMarketToken(identity, marketId, isObserver){
    console.debug(`logging into market ${marketId} with cognito identity ${identity} and isObserver ${isObserver}`);
    return this.getMarketTokenAndLoginData(identity, marketId, isObserver)
      .then((loginData) => {
        const { uclusion_token } = loginData;
        return uclusion_token;
      });

  }

  getMarketTokenAndLoginData(identity, marketId, isObserver) {
    console.debug(`logging into market ${marketId} with cognito identity ${identity} and isObserver ${isObserver}`);
    return this.ssoClient.marketCognitoLogin(identity, marketId, isObserver)
      .then((loginData) => {
        const { uclusion_token } = loginData;
        this.tokenStorageManager.storeToken(TOKEN_TYPE_MARKET, marketId, uclusion_token);
        return loginData;
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

}

export default TokenFetcher;
