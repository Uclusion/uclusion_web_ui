export const RECEIVE_INVESTIBLES = 'RECEIVE_INVESTIBLES';
export const INVEST_INVESTIBLE = 'INVEST_INVESTIBLE';
export const INVESTMENT_CREATED = 'INVESTMENT_CREATED';
export const INVESTIBLE_CREATED = 'INVESTIBLE_CREATED';
export const DELETE_MARKET_INVESTIBLE = 'DELETE_MARKET_INVESTIBLE';
export const MARKET_INVESTIBLE_DELETED = 'MARKET_INVESTIBLE_DELETED';
export const INVESTMENTS_DELETED = 'INVESTMENTS_DELETED';
export const MARKET_INVESTIBLE_CREATED = 'MARKET_INVESTIBLE_CREATED';
export const RECEIVE_MARKET_INVESTIBLE_LIST = 'RECEIVE_MARKET_INVESTIBLE_LIST';
export const INVESTIBLE_FOLLOW_UNFOLLOW = 'INVESTIBLE_FOLLOW_UNFOLLOW';
export const MARKET_INVESTIBLE_EDITED = 'MARKET_INVESTIBLE_EDITED';
export const RECEIVE_INVESTIBLE_LIST = 'RECEIVE_INVESTIBLE_LIST';

export const investibleDeleted = (marketId, investibleId) => ({
  type: MARKET_INVESTIBLE_DELETED,
  investibleId,
  marketId,
});


export const investmentsDeleted = (marketId, investibleId) => ({
  type: INVESTMENTS_DELETED,
  marketId,
  investibleId,
});

export const receiveInvestibleList = (marketId, investibleList) => ({
  type: RECEIVE_INVESTIBLE_LIST,
  marketId,
  investibleList,
});

export const receiveInvestibles = (marketId, investibles) => ({
  type: RECEIVE_INVESTIBLES,
  investibles,
  marketId,
});

export const investmentCreated = investment => ({
  type: INVESTMENT_CREATED,
  investment,
});

export const marketInvestibleCreated = (investment, marketInvestible) => ({
  type: MARKET_INVESTIBLE_CREATED,
  investment,
  marketInvestible,
});

export const investibleCreated = investible => ({
  type: INVESTIBLE_CREATED,
  investible,
});

export const investibleFollowed = (investible, isFollowing) => ({
  type: INVESTIBLE_FOLLOW_UNFOLLOW,
  investible,
  isFollowing,
});
