/*
Class that manages the tokens for a particular type and market.
It _does not_ manage identity's, but does
ask the identity source for new identities when needed
 */
import TokenStorageManager, { TOKEN_TYPE_ACCOUNT, TOKEN_TYPE_MARKET, TOKEN_TYPE_FILE } from './TokenStorageManager';
import { getTokenSecondsRemaining } from './tokenUtils';
import { AllSequentialMap } from '../utils/PromiseUtils';

class TokenFetcher {

  constructor(tokenRefresher, ssoClient, tokenType, itemId, isObserver) {
    this.ssoClient = ssoClient;
    this.tokenRefresher = tokenRefresher;
    this.tokenStorageManager = new TokenStorageManager();
    this.tokenType = tokenType;
    this.itemId = itemId;
    this.isObserver = isObserver;
  }


  /**
   * Gets a token for our type of token and item id
   * @returns {void|undefined|Promise<the>}
   */
  getToken() {
    const token = this.tokenStorageManager.getValidToken(this.tokenType, this.itemId);
    if (token) {
      return Promise.resolve(token);
    }
    return this.getRefreshedToken(this.itemId);
  }

  getRefreshedToken(itemId){
    if (this.tokenType === TOKEN_TYPE_MARKET || this.tokenType === TOKEN_TYPE_ACCOUNT) {
      return this.getIdentityBasedToken(this.isObserver, itemId);
    }
    if (this.tokenType === TOKEN_TYPE_FILE) {
      return this.refreshFileToken(itemId);
    }
    throw new Error('Can\'t refresh your token because I don\'t know how');
  }


  /**
   * Refreshes a file token for the given item id
   * Note this dies if there is no existing token in the system
   * or we can't get a token for the market that issued the file token
   */
  refreshFileToken(itemId) {
    const oldToken = this.tokenStorageManager.getToken(TOKEN_TYPE_FILE, itemId);
    this.tokenRefresher.refreshToken(oldToken)
      .then((result) => {
        const { uclusion_token } = result;
        this.tokenStorageManager.storeToken(TOKEN_TYPE_FILE, itemId, uclusion_token);
        return uclusion_token;
      });
  }

  getIdentityBasedToken(isObserver, itemId) {
    return this.tokenRefresher.getIdentity()
      .then((identity) => {
        switch(this.tokenType){
          case TOKEN_TYPE_MARKET:
            return this.getMarketToken(identity, itemId, isObserver);
          case TOKEN_TYPE_ACCOUNT:
            return this.getAccountToken(identity, itemId);
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
    // console.debug(`logging into market ${marketId} with cognito identity ${identity} and isObserver ${isObserver}`);
    return this.getMarketTokenAndLoginData(identity, marketId, isObserver)
      .then((loginData) => {
        const { uclusion_token } = loginData;
        return uclusion_token;
      });

  }

  getMarketTokenAndLoginData(identity, marketId, isObserver) {
    // console.debug(`logging into market ${marketId} with cognito identity ${identity} and isObserver ${isObserver}`);
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

  /**
   * Refreshes all tokens of the token type if
   * they are going to expire within minSecondsRemaining
   * seconds
   * @param tokenType the type of token to refresh
   * @param minSecondsRemaining the minimum time in seconds
   * that a token can have remaining before it gets refreshed
   */
  refreshTokens(minSecondsRemaining) {
    const tokens = this.tokenStorageManager.getTokens(this.tokenType);
    const objectIds = Object.keys(tokens);
    const expiring = objectIds.reduce((acc, id) => {
      const tokenString = tokens[id];
      const expirationSeconds = getTokenSecondsRemaining(tokenString);
      if (expirationSeconds <= minSecondsRemaining) {
        return [...acc, id];
      }
      return acc;
    }, []);
    return AllSequentialMap(expiring, (id) => this.getRefreshedToken(id));
  }

}

export default TokenFetcher;
