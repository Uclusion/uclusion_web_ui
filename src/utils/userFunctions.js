export function getFlags(user) {
  return (user && user.flags) || {};
}

export function getMarketInfo(investible, marketId) {
  return investible.market_infos.find((info) => info.market_id === marketId);
}