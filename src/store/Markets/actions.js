
export const RECEIVE_MARKET = 'RECEIVE_MARKET';
export const SELECT_MARKET = 'SELECT_MARKET';
export const FOLLOWED_MARKET = 'FOLLOWED_MARKET';

export const receiveMarket = market => ({
  type: RECEIVE_MARKET,
  market,
});

export const followedMarket = (marketId, following) => ({
  type: FOLLOWED_MARKET,
  marketId,
  following,
});

