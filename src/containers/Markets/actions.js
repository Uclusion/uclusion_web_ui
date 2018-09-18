import config from '../../config/config'
import uclusion from 'uclusion_sdk'

export const REQUEST_MARKET = 'REQUEST_MARKET';
export const RECEIVE_MARKET = 'RECEIVE_MARKET';
export const SELECT_MARKET = 'SELECT_MARKET';
export const REQUEST_TEAMS = 'REQUEST_TEAMS';
export const RECEIVE_TEAMS = 'RECEIVE_TEAMS';


export const requestMarket = () => ({
  type: REQUEST_MARKET
});

export const receiveMarket = market => ({
  type: RECEIVE_MARKET,
  market
});

export const selectMarket = marketId => ({
  type: SELECT_MARKET,
  marketId
});

export const requestTeams = marketId => ({
  type: REQUEST_TEAMS,
  marketId
});

export const receiveTeams = teams => ({
  type: RECEIVE_TEAMS,
  teams
});

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

export const fetchTeams = (params = {}) => (dispatch) => {
  const { marketId } = params;
  dispatch(requestTeams(marketId));
  // TODO either constructClient must cache the client or we have to at the upper level
  uclusion.constructClient(config.api_configuration).then((client) => {
    return client.markets.listTeams(marketId)
  }).then(teams => dispatch(receiveTeams(teams)))
    .catch((error)=> {
      console.log(error);
      dispatch(receiveTeams([]))
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
