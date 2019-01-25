export function getAuthMarketId () {
  const urlParams = new URLSearchParams(window.location.search)
  const authMarket = urlParams.get('authMarket')
  if (authMarket != null){
    return authMarket
  }
  return getMarketId();
}

export function getMarketId () {
  const path = window.location.pathname
  console.log('Current location ' + path)
  const noSlash = path.substr(1)
  const end = noSlash.indexOf('/')
  const marketId = noSlash.substr(0, end)
  return marketId
}