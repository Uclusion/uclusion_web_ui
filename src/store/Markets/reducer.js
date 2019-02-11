import { combineReducers } from 'redux';
import PropTypes from 'prop-types';
import _ from 'lodash';
import {
  RECEIVE_MARKET,
  SELECT_MARKET,
  RECEIVE_MARKET_CATEGORIES,
  formatMarkets,
  MARKET_CATEGORY_DELETED,
  MARKET_CATEGORY_CREATED,
} from './actions';

export const marketPropType = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  category_count: PropTypes.number.isRequired,
  users_in: PropTypes.number.isRequired,
  unspent: PropTypes.number.isRequired,
  follow_default: PropTypes.bool.isRequired,
  is_multi_team: PropTypes.bool.isRequired,
  open_investments: PropTypes.number.isRequired,
  trending_window: PropTypes.number.isRequired,
  manual_roi: PropTypes.bool.isRequired,
  created_at: PropTypes.instanceOf(Date).isRequired,
  updated_at: PropTypes.instanceOf(Date).isRequired,
});

export const categoryPropType = PropTypes.shape({
  name: PropTypes.string.isRequired,
});

const marketItems = (state = [], action) => {
  switch (action.type) {
    case RECEIVE_MARKET:
      const markets = [action.market];
      return _.unionBy(markets, state, 'id');
    default:
      return state;
  }
};

const currentMarketId = (state = null, action) => {
  switch (action.type) {
    case SELECT_MARKET:
      return action.marketId;
    default:
      return state;
  }
};

const marketCategories = (state = {}, action) => {
  switch (action.type) {
    case RECEIVE_MARKET_CATEGORIES:
      const newState = { ...state };
      newState[action.categories.market_id] = action.categories.categories;
      return newState;
    case MARKET_CATEGORY_DELETED:
      const newStateForCategories = { ...state };
      newStateForCategories[action.marketId] = state[action.marketId].filter(item => item.name !== action.name);
      return newStateForCategories;
    case MARKET_CATEGORY_CREATED:
      const categories = [action.category];
      const newStateAddCategories = { ...state };
      newStateAddCategories[action.marketId] = _.unionBy(categories, state[action.marketId], 'name');
      return newStateAddCategories;
    default:
      return state;
  }
};

export const getMarkets = state => formatMarkets(state.marketItems);

export const getMarketCategories = state => (state.currentMarketId ? state.marketCategories[state.currentMarketId] : []);

export const getCurrentMarketId = state => state.currentMarketId;

export default combineReducers({
  marketItems,
  marketCategories,
  currentMarketId,
});
