import { combineReducers } from 'redux';
import PropTypes from 'prop-types';
import _ from 'lodash';
import {
  RECEIVE_MARKET,
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
      return _.unionBy([action.market], state, 'id');
    default:
      return state;
  }
};


const formatMarket = (market) => {
  const newMarket = {
    ...market,
    created_at: new Date(market.created_at),
    updated_at: new Date(market.updated_at),
  };
  return newMarket;
};

export const formatMarkets = (markets) => {
  const formatted = markets.map(market => formatMarket(market));
  return formatted;
};

export const getMarkets = state => formatMarkets(state.marketItems);


export default combineReducers({
  marketItems,
});
