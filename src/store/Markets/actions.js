import { getClient } from '../../config/uclusionClient';
import { ERROR, sendIntlMessage, SUCCESS } from '../../utils/userMessage';

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
  following
});

export const followedMarketStage = (marketId, stageId, following) => ({
  type: FOLLOWED_MARKET_STAGE,
  marketId,
  stageId,
  following
});

export const followUnfollowMarket = (params = {}) => (dispatch) => {
  const { marketId, following } = params;
  const clientPromise = getClient();
  return clientPromise.then(client => client.markets.followMarket(marketId, following))
    .then((response) => {
      dispatch(followedMarket(marketId, response.following));
      const followMsg = response.following ? 'marketFollowSuccess' : 'marketUnfollowSuccess';
      sendIntlMessage(SUCCESS, { id: followMsg });
    }).catch((error) => {
      console.log(error);
      sendIntlMessage(ERROR, { id: 'marketFollowFailed' });
    });
};

export const followUnFollowMarketStage = (params = {}) => (dispatch) => {
  const { marketId, stageId, following } = params;
  const clientPromise = getClient();
  return clientPromise.then(client => client.markets.followStage(stageId, marketId, following))
    .then((response) => {
      dispatch(followedMarketStage(marketId, stageId, response.following));
      const followMsg = response.following ? 'stageFollowSuccess' : 'stageUnfollowSuccess';
      sendIntlMessage(SUCCESS, { id: followMsg });
    }).catch((error) => {
      console.log(error);
      sendIntlMessage(error, { id: 'stageFollowFailed' });
    });
};

export const fetchMarketStages = (params = {}) => (dispatch) => {
  const clientPromise = getClient();
  const { marketId } = params;
  console.debug('Fetching market stages');
  return clientPromise.then(client => client.markets.listStages(marketId))
    .then((stageList) => {
      dispatch(receiveMarketStages(stageList, marketId));
    }).catch((error) => {
      console.log(error);
    });
};

export const fetchMarketCategories = (params = {}) => (dispatch) => {
  const clientPromise = getClient();
  console.debug('Fetching market categories');
  const { marketId } = params;
  return clientPromise.then(client => client.markets.listInvestibles(marketId))
    .then((response) => {
      const { categories } = response;
      dispatch(receiveMarketCategories(categories, marketId));
    }).catch((error) => {
      console.log(error);
      dispatch(receiveMarketCategories({}));
    });
};

export const deleteMarketCategory = (params = {}) => (dispatch) => {
  const clientPromise = getClient();
  return clientPromise.then(client => client.investibles.deleteCategory(params.name, params.marketId))
    .then((deleted) => {
      dispatch(categoryDeleted(params.name, params.marketId));
      sendIntlMessage(SUCCESS, { id: 'marketCategoryDeleted' });
    }).catch((error) => {
      console.log(error);
      sendIntlMessage(ERROR, { id: 'marketCategoryDeleteFailed' });
    });
};

export const createMarketCategory = (params = {}) => (dispatch) => {
  const clientPromise = getClient();
  return clientPromise.then(client => client.investibles.createCategory(params.name, params.marketId))
    .then((category) => {
      category.investiblesIn = 0;
      dispatch(categoryCreated(category, params.marketId));
      sendIntlMessage(SUCCESS, { id: 'marketCategoryCreated' });
    }).catch((error) => {
      console.log(error);
      sendIntlMessage(ERROR, { id: 'marketCategoryCreateFailed' });
    });
};

export const fetchMarket = (params = {}) => (dispatch) => {
  const clientPromise = getClient();
  return clientPromise.then(client => client.markets.get(params.market_id)).then((market) => {
    dispatch(receiveMarket(market));
  }).catch((error) => {
    console.error(error);
    dispatch(receiveMarket([]));
  });
};

const formatMarket = (market) => {
  market.created_at = new Date(market.created_at);
  market.updated_at = new Date(market.updated_at);
  return market;
};

export const formatMarkets = (markets) => {
  markets.forEach((market) => {
    formatMarket(market);
  });
  return markets;
};
