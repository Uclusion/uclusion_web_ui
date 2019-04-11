import { combineReducers } from 'redux';
import PropTypes from 'prop-types';
import _ from 'lodash';
import {
  RECEIVE_MARKET,
  RECEIVE_MARKET_CATEGORIES,
  formatMarkets,
  MARKET_CATEGORY_DELETED,
  MARKET_CATEGORY_CREATED,
  RECEIVE_MARKET_STAGES,
  FOLLOWED_MARKET_STAGE
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

const marketStages = (state = {}, action) => {
  const newState = { ...state };
  const { marketId } = action;
  switch(action.type) {
    case RECEIVE_MARKET_STAGES:
      const { stages } = action;
      newState[marketId] = stages;
      return newState;
    case FOLLOWED_MARKET_STAGE:
      const { stageId, following } = action;
      if (newState[marketId]) {
        const stage = newState[marketId].find(element => element.id === stageId);
        stage.following = following;
      }
      return newState;
    default:
      return state;
  }
};

const marketCategories = (state = {}, action) => {
  switch (action.type) {
    case RECEIVE_MARKET_CATEGORIES:
      const newState = { ...state };
      newState[action.marketId] = action.categories;
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

export const getStages = state => state.marketStages;

export const getMarketCategories = state => state.marketCategories;

export default combineReducers({
  marketItems,
  marketCategories,
  marketStages
});
