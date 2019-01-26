/**
 * Gets the market id of the market used for authorization
 * @returns {string}
 */
export function getAuthMarketId () {
  const urlParams = new URLSearchParams(window.location.search)
  const authMarket = urlParams.get('authMarket')
  if (authMarket != null) {
    return authMarket
  }
  return getMarketId()
}

/**
 * Gets the market id from the URL if it's present in it.
 * @returns {string}
 */
export function getMarketId () {
  const path = window.location.pathname
  console.log('Current location ' + path)
  const noSlash = path.substr(1)
  const end = noSlash.indexOf('/')
  const marketId = noSlash.substr(0, end)
  return marketId
}

/**
 * Appends the auth market id to the relative link given and returns the new relative link so formed
 * @param relativeDestination
 * @param authMarketId
 * @returns {string}
 */
function appendAuthMarket (relativeDestination, authMarketId) {
  // window.location.href is just to make the parser happy. We'll discard it to make sure we give a relative link
  const url = new URL(relativeDestination, window.location.href)
  const searchParams = url.searchParams
  searchParams.append('authMarketId', authMarketId);

  return url.pathname + '?' + searchParams.toString()
}

/**
 * Forms a relative link and embeds the active market and auth market if needed
 * @param realtiveDestination
 */
export function formMarketSpecificLink (subPath){
  const market = getMarketId()
  const authMarket = getAuthMarketId()
  const dest = '/' + market + '/' + subPath
  if ( market !== authMarket ) {
    return appendAuthMarket(dest, authMarket)
  }
  return dest
}