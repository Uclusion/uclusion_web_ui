export function processUserForDisplay(user, marketId) {
  const processed = { ...user };
  const marketPresence = user.market_presences.find(presence => presence.market_id === marketId || presence.id === marketId);
  processed.quantity = marketPresence.quantity;
  processed.quantity_invested = marketPresence.quantity_invested;
  return processed;
}
