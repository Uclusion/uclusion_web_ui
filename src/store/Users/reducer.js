import { combineReducers } from 'redux';
import PropTypes from 'prop-types';
import _ from 'lodash';
import {
  RECEIVE_USER, RECEIVE_CURRENT_USER, REQUEST_CURRENT_USER, formatUsers,
} from './actions';

import { FOLLOWED_MARKET } from '../Markets/actions';
import { INVESTMENTS_DELETED } from '../MarketInvestibles/actions';

export const userPropType = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  account_id: PropTypes.string.isRequired,
  market_presences: PropTypes.arrayOf(PropTypes.shape({
    quantity: PropTypes.number.isRequired,
    market_id: PropTypes.string.isRequired,
    market_permissions: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
    market_name: PropTypes.string.isRequired,
    following: PropTypes.bool.isRequired,
  }).isRequired),
  created_at: PropTypes.instanceOf(Date).isRequired,
  updated_at: PropTypes.instanceOf(Date).isRequired,
});

const userItems = (state = [], action) => {
  switch (action.type) {
    case RECEIVE_USER:
      const user = [action.user];
      return _.unionBy(user, state, 'id');
    default:
      return state;
  }
};

const updateMarketFollowState = (state, action) => {
  if (!state) {
    return state;
  }
  const { marketId, following } = action;
  const newState = { ...state };
  if (newState.market_presence.id !== marketId) {
    return state;
  }
  // update the current presence
  newState.market_presence.following = following;
  return newState;
};

const updateInvestmentsDeletedState = (state, action) => {
  if (!state) {
    return state;
  }
  const { marketId, quantity } = action;
  const newState = { ...state };
  if (newState.market_presence.id !== marketId) {
    return state;
  }
  // update the current presence
  newState.market_presence.quantity -= quantity;
  return newState;
};

const currentUser = (state = null, action) => {
  switch (action.type) {
    case RECEIVE_CURRENT_USER:
    case REQUEST_CURRENT_USER:
      // This user object on request won't have market presences but better than nothing
      return action.user ? action.user : state;
    case FOLLOWED_MARKET:
      return updateMarketFollowState(state, action);
    case INVESTMENTS_DELETED:
      return updateInvestmentsDeletedState(state, action);
    default:
      return state;
  }
};

export const getUsers = state => formatUsers(state.userItems);

export const getCurrentUser = state => state.currentUser;

export default combineReducers({
  userItems,
  currentUser,
});
