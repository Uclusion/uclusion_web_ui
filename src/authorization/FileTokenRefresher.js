import jwt_decode from 'jwt-decode';
import { getMarketClient } from '../api/uclusionClient';

/**
 * Represents the "identity" for a file. E.g. it's your market association
 * and refreshes
 */
class FileTokenRefresher {
  refreshToken(oldToken) {
    const decoded = jwt_decode(oldToken);
    const { id: marketId } = decoded;
    return getMarketClient(marketId)
      .then((client) => client.markets.refreshFileToken(oldToken));
  }
}

export default FileTokenRefresher;
