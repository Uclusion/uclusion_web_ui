export const listUserMarkets = (user) => {
  if (!user || !user.team_presences) {
    return [];
  }
  const teamPresence = user.team_presences.find(team => team.team_id === user.default_team_id);
  if (!teamPresence) {
    return [];
  }
  return teamPresence.market_list;
};

export const getCurrentMarketPresence = (user) => {
  if (!user) {
    return undefined;
  }
  return user.market_presence;
};

export const getMarketPresence = (user, marketId) => {
  const markets = listUserMarkets(user);
  const currentMarket = markets.find(market => market.id === marketId);
  return currentMarket;
};

export const getMarketPresenceName = (user, marketId) => {
  const currentMarket = getMarketPresence(user, marketId);
  if (!currentMarket) {
    return '';
  }
  return currentMarket.name;
};
