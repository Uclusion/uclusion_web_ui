import jwt_decode from 'jwt-decode';
import { getTokenFetcher } from '../api/uclusionClient';
import { TOKEN_TYPE_MARKET } from './TokenStorageManager';
import { VIEW_EVENT, VISIT_CHANNEL } from '../contexts/NotificationsContext/NotificationsContext';
import { registerListener } from '../utils/MessageBusUtils';

/**
 * Returns the number of seconds before the token in
 * token string expires
 * @param tokenString
 * @returns {number} the number of seconds until expiry. Negative numbers
 * represent tokens which have already expired
 */
export function getTokenSecondsRemaining (tokenString) {
  const decoded = jwt_decode(tokenString);
  const { exp } = decoded; // exp is seconds since the epoch (1/1/1970 00:00:00)
  const currentTimeMillis = new Date().getTime();
  const currentTimeSeconds = currentTimeMillis / 1000;
  return (exp - currentTimeSeconds);
}

export function registerMarketTokenListeners () {
  const myListener = (data) => {
    if (!data) {
      return;
    }
    const { payload: { event } } = data;
    switch (event) {
      case VIEW_EVENT: {
        return getTokenFetcher(TOKEN_TYPE_MARKET)
          .then((fetcher) => {
            // refresh any token expiring within 72 hours.
            return fetcher.refreshExpiringTokens(72);
          });
      }
      default:
        return;
    }
  };
  registerListener(VISIT_CHANNEL, 'marketTokenRefresher', myListener);
}
