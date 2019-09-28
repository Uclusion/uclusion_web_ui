import { getUclusionLocalStorageItem, setUclusionLocalStorageItem } from '../components/utils';
import jwt_decode from 'jwt-decode';
import { TOKEN_TYPE_ACCOUNT, TOKEN_TYPE_MARKET, TOKEN_TYPE_FILE } from './TokenManager';

const TOKEN_STORAGE_KEY = 'TOKEN_STORAGE_MANAGER';


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

  putTokenStorage(newStorage) {
    setUclusionLocalStorageItem(TOKEN_STORAGE_KEY, newStorage);
  }

  clearTokenStorage() {
    setUclusionLocalStorageItem(TOKEN_STORAGE_KEY, this.getEmptyStorage());
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

  storeToken(tokenType, itemId, token) {
    const tokenStorage = this.getTokenStorage();
    tokenStorage[tokenType][itemId] = token;
    this.putTokenStorage(tokenStorage);
  }

  /**
   * Takes a token string, decodes it, and determines if it's going to expire in the next
   * minute
   * @param tokenString the string form of the token
   * @returns if the token is valid and not expiring in the next minute
   */
  isTokenValid(tokenString) {
    const decoded = jwt_decode(tokenString);
    const { exp } = decoded; // exp is seconds since the epoch (1/1/1970 00:00:00)
    const currentTimeMillis = new Date().getTime();
    const currentTimeSeconds = currentTimeMillis / 1000;
    return (exp - currentTimeSeconds) >= 60;
  }
}

export default TokenStorageManager;