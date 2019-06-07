
export const RECEIVE_MARKET = 'RECEIVE_MARKET';
export const SELECT_MARKET = 'SELECT_MARKET';
export const RECEIVE_MARKET_CATEGORIES = 'RECEIVE_MARKET_CATEGORIES';
export const MARKET_CATEGORY_DELETED = 'MARKET_CATEGORY_DELETED';
export const MARKET_CATEGORY_CREATED = 'MARKET_CATEGORY_CREATED';
export const FOLLOWED_MARKET = 'FOLLOWED_MARKET';
export const RECEIVE_MARKET_STAGES = 'RECEIVE_MARKET_STAGES';
export const FOLLOWED_MARKET_STAGE = 'FOLLOWED_MARKET_STAGE';

export const receiveMarket = market => ({
  type: RECEIVE_MARKET,
  market,
});

export const receiveMarketStages = (stages, marketId) => ({
  type: RECEIVE_MARKET_STAGES,
  stages,
  marketId,
});

export const receiveMarketCategories = (categories, marketId) => ({
  type: RECEIVE_MARKET_CATEGORIES,
  categories,
  marketId,
});

export const categoryDeleted = (name, marketId) => ({
  type: MARKET_CATEGORY_DELETED,
  name,
  marketId,
});

export const categoryCreated = (category, marketId) => ({
  type: MARKET_CATEGORY_CREATED,
  category,
  marketId,
});

export const followedMarket = (marketId, following) => ({
  type: FOLLOWED_MARKET,
  marketId,
  following,
});

export const followedMarketStage = (marketId, stageId, following) => ({
  type: FOLLOWED_MARKET_STAGE,
  marketId,
  stageId,
  following,
});


