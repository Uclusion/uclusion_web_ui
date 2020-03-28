import jwt_decode from 'jwt-decode';
import { getUclusionLocalStorageItem, setUclusionLocalStorageItem } from '../components/utils';
import _ from 'lodash';
import { getTokenSecondsRemaining } from './tokenUtils';

const TOKEN_STORAGE_KEY = 'TOKEN_STORAGE_MANAGER';
export const TOKEN_TYPE_MARKET = 'MARKET';
export const TOKEN_TYPE_ACCOUNT = 'ACCOUNT';
export const TOKEN_TYPE_FILE = 'FILE';


class TokenStorageManager {

  getEmptyStorage() {
    return {
      [TOKEN_TYPE_MARKET]: {},
      [TOKEN_TYPE_ACCOUNT]: {},
      [TOKEN_TYPE_FILE]: {},
    };
  }

  getTokenStorage() {
    const tokenStorage = getUclusionLocalStorageItem(TOKEN_STORAGE_KEY) || this.getEmptyStorage();
    return tokenStorage;
  }

  /**
   * Loads the provided storage into the token storage system
   * @param newStorage
   */
  putTokenStorage(newStorage) {
    setUclusionLocalStorageItem(TOKEN_STORAGE_KEY, newStorage);
  }

  /**
   * Clears the entirety of token storage
   */
  clearTokenStorage() {
    setUclusionLocalStorageItem(TOKEN_STORAGE_KEY, this.getEmptyStorage());
  }

  /**
   * Removes the given token from the token storage system
   * @param tokenType the type of token we are removing
   * @param itemId the id of the item we're removing
   */
  removeToken(tokenType, itemId) {
    const tokenStorage = this.getTokenStorage();
    delete tokenStorage[tokenType][itemId];
    this.putTokenStorage(tokenStorage);
  }

  /**
   * Returns a token from the system for the given type and item id
   * <i>regardless if it is valid</i>
   * @param tokenType the type of token we want
   * @param itemId the id of the item we want
   */
  getToken(tokenType, itemId) {
    const tokenStorage = this.getTokenStorage();
    const token = tokenStorage[tokenType][itemId];
    return token;
  }

  /**
   * Returns a token from token storage that is for the given token type, and id, and
   * will not expire in the next minute.
   * @param tokenType the type of token we want
   * @param itemId the id of the item we want the token for
   * @returns the string form of the token, or null if a valid one doesn't exist
   */
  getValidToken(tokenType, itemId) {
    const tokenStorage = this.getTokenStorage();
    const token = tokenStorage[tokenType][itemId];
    if (token && this.isTokenValid(token)) {
      return token;
    }
    return null;
  }

  /**
   * Returns an object containing all tokens of the given type
   * @param tokenType the token type to get
   */
  getTokens(tokenType) {
    const tokenStorage = this.getTokenStorage();
    return tokenStorage[tokenType];
  }

  /**
   * Stores a token into the token storage, unless a token for that
   * type and item exists, and the existing token has a later expiry
   * @param tokenType the type of token we're storing
   * @param itemId the item id we're storing a token for
   * @param token the token we want to store.
   */
  storeToken(tokenType, itemId, token) {
    const tokenStorage = this.getTokenStorage();
    const existingToken = tokenStorage[tokenType][itemId];
    // // console.debug(existingToken);
    // // console.debug(token);
    // bail out if our existing token is newer
    if (!_.isEmpty(existingToken)) {
      const longestLife = this.getLongestLivingToken(token, existingToken);
      if (longestLife === existingToken) {
        return;
      }
    }
    tokenStorage[tokenType][itemId] = token;
    this.putTokenStorage(tokenStorage);
  }

  /**
   * Given two tokens returns the token with the most life left on it
   * @param token1 a token
   * @param token2 a token
   * @returns the token with the most life remaining on it
   */
  getLongestLivingToken(token1, token2) {
    if (_.isEmpty(token1) || _.isEmpty(token2)) {
      console.error('Token is empty');
      return undefined;
    }
    const t1decode = jwt_decode(token1);
    const { exp: t1exp } = t1decode; // exp is seconds since the epoch (1/1/1970 00:00:00)
    const t2decode = jwt_decode(token2);
    const { exp: t2exp } = t2decode; // exp is seconds since the epoch (1/1/1970 00:00:00)
    if (t1exp > t2exp) {
      return token1;
    }
    return token2;
  }

  /**
   * Takes a token string, decodes it, and determines if it's going to expire in the next
   * minute
   * @param tokenString the string form of the token
   * @returns if the token is valid and not expiring in the next minute
   */
  isTokenValid(tokenString) {
    if (_.isEmpty(tokenString)) {
      return false;
    }
    const secondsRemaining = getTokenSecondsRemaining(tokenString);
    return secondsRemaining >= 60;
  }
}

export default TokenStorageManager;
