/*
Class that fetches and refreshes the tokens for a particular type and market.
It _does not_ manage identity's, but does
ask the identity source for new identities when needed
 */

import { AllSequentialMap } from '../utils/PromiseUtils';
import { getTokenStorageManager } from '../api/singletons';
import { TOKEN_TYPE_MARKET, TOKEN_TYPE_MARKET_INVITE } from '../api/tokenConstants';

class MarketTokenFetcher {

  constructor (tokenRefresher, ssoClient, tokenType, itemId) {
    this.ssoClient = ssoClient;
    this.tokenRefresher = tokenRefresher;
    this.tokenStorageManager = getTokenStorageManager();
    this.tokenType = tokenType;
    this.itemId = itemId;
  }

  /**
   * Gets a token for our type of token and item id
   * @returns {void|undefined|Promise<the>}
   */
  async getToken () {
    // first get the token storage lock on this token type and item
    const tokenLockId = `${this.tokenType}_${this.itemId}`;
    return navigator.locks.request(tokenLockId, async () => {
      const token = await this.tokenStorageManager.getValidToken(this.tokenType, this.itemId);
      if (token) {
        return token;
      }
      // we're either expired, or never had a token
      //console.log(`refreshing token for ${this.tokenType} id ${this.itemId}`);
      return await this.getAndStoreRefreshedToken(this.itemId); // this will automatically store
    });
  }

  /**
   * Refreshes all tokens of the given type that expire within windowHours
   * @param windowHours the number of hours a token must still be valid for otherwise we'll refresh it
   */
  refreshExpiringTokens(windowHours){
    return this.tokenStorageManager.getExpiringTokens(this.tokenType, windowHours)
    .then((expiringRaw) => {
      const expiring = (expiringRaw || []).filter((anItem) => anItem !== 'undefined');
      return AllSequentialMap(expiring, (itemId) => this.getAndStoreRefreshedToken(itemId),
        false);
    });
  }

  getAndStoreRefreshedToken(itemId) {
    if (this.tokenType === TOKEN_TYPE_MARKET) {
      return this.getIdentityBasedToken(itemId);
    }
    throw new Error('Can\'t refresh your token because I don\'t know how');
  }

  getIdentityBasedToken(itemId) {
    return this.tokenRefresher.getIdentity()
      .then((identity) => {
        switch (this.tokenType) {
          case TOKEN_TYPE_MARKET:
            return this.getMarketToken(identity, itemId);
          default:
            throw new Error('Unknown token type');
        }
      });
  }

  getIdentityBasedTokenAndInfo () {
    return this.tokenRefresher.getIdentity()
      .then((identity) => {
        switch (this.tokenType) {
          case TOKEN_TYPE_MARKET:
            return this.getMarketTokenAndLoginData(identity, this.itemId);
          case TOKEN_TYPE_MARKET_INVITE:
            return this.getMarketTokenOnInvite(identity, this.itemId);
          default:
            throw new Error('Unknown token type');
        }
      });
  }

  getMarketToken (identity, marketId) {
    return this.getMarketTokenAndLoginData(identity, marketId)
      .then((loginData) => {
        const { uclusion_token } = loginData;
        return uclusion_token;
      });

  }

  getMarketTokenAndLoginData (identity, marketId) {
    return this.ssoClient.marketCognitoLogin(identity, marketId)
      .then((loginData) => {
        const { uclusion_token } = loginData;
        return this.tokenStorageManager.storeToken(TOKEN_TYPE_MARKET, marketId, uclusion_token)
          .then(() => loginData);
      });

  }

  getMarketTokenOnInvite (identity, marketToken) {
    return this.ssoClient.marketInviteLogin(identity, marketToken)
      .then((loginData) => {
        const { uclusion_token, market_id: marketId } = loginData;
        return this.tokenStorageManager.storeToken(TOKEN_TYPE_MARKET, marketId, uclusion_token)
          .then(() => loginData);
      });

  }
}

export default MarketTokenFetcher;
