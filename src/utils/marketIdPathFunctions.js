/**
 * Gets the market id from the URL if it's present in it.
 * @returns {string}
 */
export function getMarketId(path, search = '/dialog/') {
  if (!path) {
    return null;
  }
  if (!path.startsWith(search)) {
    return null;
  }
  const pathPart = path.substr(search.length);
  const investibleSlashLocation = pathPart.indexOf('/');
  if (investibleSlashLocation === -1) {
    return pathPart;
  }
  return pathPart.substr(0, investibleSlashLocation);
}

/**
 * Helper function to centralize market id subpath link formation
 * @param marketId
 * @param subPath
 * @returns {string}
 */
function formMarketIdLink(marketId, subPath) {
  if (!subPath) {
    return `/dialog/${marketId}`;
  }
  return `/dialog/${marketId}/${subPath}`;
}

/**
 * Forms a link to a given market id with the given subpath. Usually used when switching
 * to a different market
 * @param marketId
 * @param subPath
 * @returns {string}
 */
export function formMarketLink(marketId, subPath) {
  return formMarketIdLink(marketId, subPath);
}
