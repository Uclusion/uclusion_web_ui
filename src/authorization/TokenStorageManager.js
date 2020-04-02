import jwt_decode from 'jwt-decode';
import LocalForageHelper from '../utils/LocalForageHelper';
import _ from 'lodash';
import { getTokenSecondsRemaining } from './tokenUtils';

const TOKEN_STORAGE_NAMESPACE = 'TOKEN_STORAGE_MANAGER';
export const TOKEN_TYPE_MARKET = 'MARKET';
export const TOKEN_TYPE_ACCOUNT = 'ACCOUNT';

class TokenStorageManager {

  getEmptyStorage () {
    return {
      [TOKEN_TYPE_MARKET]: {},
      [TOKEN_TYPE_ACCOUNT]: {},
    };
  }

  getTokenStorage () {
    return new LocalForageHelper(TOKEN_STORAGE_NAMESPACE)
      .getState()
      .then((state) => {
        if (!state) {
          return this.getEmptyStorage();
        }
        return state;
      });
  }

  /**
   * Loads the provided storage into the token storage system
   * @param newStorage
   */
  putTokenStorage (newStorage) {
    return new LocalForageHelper(TOKEN_STORAGE_NAMESPACE)
      .setState(newStorage);
  }

  /**
   * Clears the entirety of token storage
   */
  clearTokenStorage () {
    return this.putTokenStorage(this.getEmptyStorage());
  }

  /**
   * Removes the given token from the token storage system
   * @param tokenType the type of token we are removing
   * @param itemId the id of the item we're removing
   */
  removeToken (tokenType, itemId) {
    return this.getTokenStorage()
      .then((state) => {
        delete state[tokenType][itemId];
        return this.putTokenStorage(state);
      });
  }

  /**
   * Returns a token from the system for the given type and item id
   * <i>regardless if it is valid</i>
   * @param tokenType the type of token we want
   * @param itemId the id of the item we want
   */
  getToken (tokenType, itemId) {
    return this.getTokenStorage()
      .then((state) => {
        return state[tokenType][itemId];
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
    return this.getTokenStorage()
      .then((state) => {
        const existingToken = state[tokenType][itemId];

        // // console.debug(existingToken);
        // // console.debug(token);
        // bail out if our existing token is newer
        if (!_.isEmpty(existingToken)) {
          const longestLife = this.getLongestLivingToken(token, existingToken);
          if (longestLife === existingToken) {
            return Promise.resolve(existingToken);
          }
        }
        state[tokenType][itemId] = token;
        return this.putTokenStorage(state);
      });
  }

  /**
   * Given two tokens returns the token with the most life left on it
   * @param token1 a token
   * @param token2 a token
   * @returns the token with the most life remaining on it
   */
  getLongestLivingToken (token1, token2) {
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
  isTokenValid (tokenString) {
    if (_.isEmpty(tokenString)) {
      return false;
    }
    const secondsRemaining = getTokenSecondsRemaining(tokenString);
    return secondsRemaining >= 60;
  }
}

export default TokenStorageManager;
