/**
 * Gets the market id from the URL if it's present in it.
 * @returns {string}
 */
export function getMarketId() {
  const path = window.location.pathname;
  // console.log('Current location ' + path)
  const noSlash = path.substr(1);
  const end = noSlash.indexOf('/');
  if (end === -1) {
    return noSlash;
  }
  const marketId = noSlash.substr(0, end);
  return marketId;
}

/**
 * Helper function to centralize market id subpath link formation
 * @param marketId
 * @param subPath
 * @returns {string}
 */
function formMarketIdLink(marketId, subPath) {
  if (!subPath) {
    return `/${marketId}`;
  }
  return `/${marketId}/${subPath}`;
}

/**
 * Forms a relative link and embeds the active market and auth market if needed
 * @param subPath relative destination
 */
export function formCurrentMarketLink(subPath) {
  const market = getMarketId();
  if (!market) {
    return '';
  }
  const marketLink = formMarketIdLink(market, subPath);
  return marketLink;
}

/**
 * Forms a link to a given market id with the given subpath. Usually used when switching
 * to a different market
 * @param marketId
 * @param subPath
 * @returns {string}
 */
export function formMarketLink(marketId, subPath) {
  const marketLink = formMarketIdLink(marketId, subPath);
  return marketLink;
}
