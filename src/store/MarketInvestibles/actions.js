export const RECEIVE_INVESTIBLES = 'RECEIVE_INVESTIBLES';
export const INVEST_INVESTIBLE = 'INVEST_INVESTIBLE';
export const INVESTMENT_UPDATED = 'INVESTMENT_UPDATED';
export const INVESTIBLE_CREATED = 'INVESTIBLE_CREATED';
export const DELETE_INVESTIBLE = 'DELETE_INVESTIBLE';
export const INVESTIBLE_DELETED = 'INVESTIBLE_DELETED';
export const INVESTIBLE_FOLLOW_UNFOLLOW = 'INVESTIBLE_FOLLOW_UNFOLLOW';
export const MARKET_INVESTIBLE_EDITED = 'MARKET_INVESTIBLE_EDITED';
export const RECEIVE_INVESTIBLE_LIST = 'RECEIVE_INVESTIBLE_LIST';

export const investibleDeleted = (marketId, investibleId) => ({
  type: INVESTIBLE_DELETED,
  investibleId,
  marketId,
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

export const investmentUpdated = (marketId, investibleId, quantity) => ({
  type: INVESTMENT_UPDATED,
  marketId,
  investibleId,
  quantity,
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
