
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

export function getMarketDetailsForType(state, marketType = 'DECISION') {
  if (state.marketDetails) {
    return state.marketDetails.filter((market) => market.market_type === marketType);
  }
  return null;
}


export function getAllMarketDetails(state) {
  return state.marketDetails;
}
