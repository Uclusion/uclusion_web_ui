

export function getGroup(state, marketId, groupId) {
  const marketsSafe  = state || {};
  const usedMarketDetails = marketsSafe[marketId];
  return usedMarketDetails.find((group) => group.id === groupId);
}
