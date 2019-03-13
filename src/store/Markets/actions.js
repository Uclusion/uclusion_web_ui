import { getClient } from '../../config/uclusionClient';
import { ERROR, sendIntlMessage, SUCCESS } from '../../utils/userMessage';

export const RECEIVE_MARKET = 'RECEIVE_MARKET';
export const SELECT_MARKET = 'SELECT_MARKET';
export const RECEIVE_MARKET_CATEGORIES = 'RECEIVE_MARKET_CATEGORIES';
export const MARKET_CATEGORY_DELETED = 'MARKET_CATEGORY_DELETED';
export const MARKET_CATEGORY_CREATED = 'MARKET_CATEGORY_CREATED';

export const receiveMarket = market => ({
  type: RECEIVE_MARKET,
  market,
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

export const fetchMarketCategories = (params = {}) => (dispatch) => {
  const clientPromise = getClient();
  console.log('Fetching market categories');
  return clientPromise.then(client => client.markets.listInvestibles(params.marketId))
    .then((response) => {
      const { categories } = response;
      dispatch(receiveMarketCategories(categories, params.marketId));
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
