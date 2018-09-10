import config from '../../config/config'
import uclusion from 'uclusion_sdk'

export const REQUEST_MARKET = 'REQUEST_MARKET'
export const RECEIVE_MARKET = 'RECEIVE_MARKET'
export const SELECT_MARKET = 'SELECT_MARKET'


export const requestMarket = () => ({
  type: REQUEST_MARKET
})

export const receiveMarket = market => ({
  type: RECEIVE_MARKET,
  market
})

export const selectMarket = marketId => ({
  type: SELECT_MARKET,
  marketId
})

export const fetchMarket = (params = {}) => (dispatch) => {
  dispatch(requestMarket())

  if (params.isSelected) {
    dispatch(selectMarket(params.market_id))
  }
  // TODO either constructClient must cache the client or we have to at the upper level
  uclusion.constructClient(config.api_configuration).then((client) => {
    return client.markets.getMarket(params.market_id)
  }).then(market => dispatch(receiveMarket(market)))
    .catch((error) => {
      console.log(error)
      dispatch(receiveMarket([]))
    })
}

const formatMarket = (market) => {
  market.created_at = new Date(market.created_at)
  market.updated_at = new Date(market.updated_at)
  return market
}

export const formatMarkets = (markets) => {
  markets.forEach((market) => {
    formatMarket(market)
  })
  return markets
}
