import jwt_decode from 'jwt-decode';

/**
 * Returns the number of seconds before the token in
 * token string expires
 * @param tokenString
 * @returns {number} the number of seconds until expiry. Negative numbers
 * represent tokens which have already expired
 */
export function getTokenSecondsRemaining(tokenString) {
  const decoded = jwt_decode(tokenString);
  const { exp } = decoded; // exp is seconds since the epoch (1/1/1970 00:00:00)
  const currentTimeMillis = new Date().getTime();
  const currentTimeSeconds = currentTimeMillis / 1000;
  return (exp - currentTimeSeconds);
}
