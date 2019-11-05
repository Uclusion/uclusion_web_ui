import { initializeState, updateAllMarketDetails } from './marketsContextReducer';
import { getMarketDetails } from '../../api/markets';
import { EMPTY_STATE } from './MarketsContext';

export function getMarket(state, marketId) {
  const { marketDetails } = state;
  const market = marketDetails.find((market) => market.id === marketId);
  return market;
}


export function getMyUserForMarket(state, marketId) {
  const market = getMarket(state, marketId);
  if (market) {
    const { currentUser } = market;
    return currentUser;
  }
  return undefined;
}

export function getMarketDetailsForType(state, marketType = 'DECISION') {
  if (state.marketDetails) {
    return state.marketDetails.filter((market) => market.market_type === marketType);
  }
  return null;
}


export function getAllMarketDetails(state) {
  return state.marketDetails;
}

export function getAllMarkets(state) {
  return state.markets;
}

// TODO need below updateSelectMarketDetails and also an action removeSelectedMarketDetails(removeMarketList)
export function refreshMarkets(dispatch, updateMarketList) {
  const promises = updateMarketList.map((marketId) => getMarketDetails(marketId));
  return Promise.all(promises)
    .then((markets) => dispatch(updateSelectMarketDetails(markets)));
}

export function clearState(dispatch) {
  dispatch(initializeState(EMPTY_STATE));
}
