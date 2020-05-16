import LocalForageHelper from '../utils/LocalForageHelper'
import _ from 'lodash'
import { getTokenSecondsRemaining } from './tokenUtils'
import localforage from 'localforage'

const TOKEN_STORAGE_KEYSPACE = 'TOKEN_STORAGE_MANAGER';
export const TOKEN_TYPE_MARKET = 'MARKET';
export const TOKEN_TYPE_ACCOUNT = 'ACCOUNT';
export const TOKEN_TYPE_MARKET_INVITE = 'MARKET_INVITE';

class TokenStorageManager {

  getKeyNamespace(tokenType, tokenId) {
    return `${tokenType}_${tokenId}`
  }

  /**
   * Clears the entirety of token storage
   */
  clearTokenStorage () {
    return localforage.createInstance({ storeName: TOKEN_STORAGE_KEYSPACE}).clear();
  }

  /**
   * Returns a token from the system for the given type and item id
   * <i>regardless if it is valid</i>
   * @param tokenType the type of token we want
   * @param itemId the id of the item we want
   */
  getToken (tokenType, itemId) {
    return new LocalForageHelper(this.getKeyNamespace(tokenType, itemId), TOKEN_STORAGE_KEYSPACE)
      .getState()
      .catch((error) => {
        console.error("Got error getting token");
        console.error(error);
      });
  }

  /**
   * Returns a token from token storage that is for the given token type, and id, and
   * will not expire in the next minute.
   * @param tokenType the type of token we want
   * @param itemId the id of the item we want the token for
   * @returns the string form of the token, or null if a valid one doesn't exist
   */
  getValidToken (tokenType, itemId) {
    return this.getToken(tokenType, itemId)
      .then((token) => {
        if (token && this.isTokenValid(token)) {
          return token;
        }
        return null;
      });
  }


  /**
   * Stores a token into the token storage, unless a token for that
   * type and item exists, and the existing token has a later expiry
   * @param tokenType the type of token we're storing
   * @param itemId the item id we're storing a token for
   * @param token the token we want to store.
   */
  storeToken (tokenType, itemId, token) {
    return new LocalForageHelper(this.getKeyNamespace(tokenType, itemId), TOKEN_STORAGE_KEYSPACE)
      .setState(token);
  }

  /**
   * Takes a token string, decodes it, and determines if it's going to expire in the next
   * minute
   * @param tokenString the string form of the token
   * @returns if the token is valid and not expiring in the next minute
   */
  isTokenValid (tokenString) {
    if (_.isEmpty(tokenString)) {
      return false;
    }
    const secondsRemaining = getTokenSecondsRemaining(tokenString);
    return secondsRemaining >= 60;
  }
}

export default TokenStorageManager;
