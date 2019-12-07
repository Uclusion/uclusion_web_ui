import { ACTIVE_STAGE, ARCHIVED_STAGE } from '../../constants/markets';

export function getMarket(state, marketId) {
  const { marketDetails } = state;
  return marketDetails.find((market) => market.id === marketId);
}

export function getMyUserForMarket(state, marketId) {
  const market = getMarket(state, marketId);
  if (market) {
    const { currentUser } = market;
    return currentUser;
  }
  return undefined;
}

export function getActiveMarketDetailsForType(state, marketType = 'DECISION') {
  if (state.marketDetails) {
    return state.marketDetails.filter((market) => market.market_type === marketType && market.market_stage === ACTIVE_STAGE);
  }
  return null;
}

export function getArchivedMarketDetailsForType(state, marketType = 'DECISION') {
  if (state.marketDetails) {
    return state.marketDetails.filter((market) => market.market_type === marketType && market.market_stage === ARCHIVED_STAGE);
  }
  return null;
}


export function getAllMarketDetails(state) {
  return state.marketDetails;
}
