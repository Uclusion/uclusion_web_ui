export function getFlags(user) {
  return (user && user.market_presence && user.market_presence.flags) || {};
}