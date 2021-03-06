import jwt_decode from 'jwt-decode';
import { getTokenFetcher } from '../api/uclusionClient';
import { TOKEN_TYPE_MARKET } from './TokenStorageManager';
import { registerListener } from '../utils/MessageBusUtils';
import { VIEW_EVENT, VISIT_CHANNEL } from '../utils/marketIdPathFunctions'



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
// the minimum time between runs of the register market token listener in milies
const TOKEN_LISTENER_MIN_RUN_INTERVAL_MILLIS = 180000; // 30 mins
let lastMarketTokenCheckTime = null;

export function registerMarketTokenListeners () {
  const myListener = (data) => {
    if (!data) {
      return;
    }
    const { payload: { event, message } } = data;
    switch (event) {
      case VIEW_EVENT: {
        const shouldRun = !lastMarketTokenCheckTime || ((Date.now() - lastMarketTokenCheckTime) >= TOKEN_LISTENER_MIN_RUN_INTERVAL_MILLIS);
        const { isEntry } = message;
        if (isEntry && shouldRun) {
          lastMarketTokenCheckTime = Date.now();
          return getTokenFetcher(TOKEN_TYPE_MARKET)
            .then((fetcher) => {
              // refresh any token expiring within 72 hours.
              return fetcher.refreshExpiringTokens(72);
            });
        }
        break;
      }
      default:
        return;
    }
  };
  registerListener(VISIT_CHANNEL, 'marketTokenRefresher', myListener);
}
