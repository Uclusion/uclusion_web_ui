import { combineReducers } from 'redux';
import PropTypes from 'prop-types';
import _ from 'lodash';
import {
  REQUEST_USER, RECEIVE_USER, RECEIVE_CURRENT_USER, REQUEST_CURRENT_USER, formatUsers,
} from './actions';

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
    case REQUEST_USER:
      return state;
    case RECEIVE_USER:
      const user = [action.user];
      return _.unionBy(user, state, 'id');
    default:
      return state;
  }
};

const currentUser = (state = null, action) => {
  switch (action.type) {
    case RECEIVE_CURRENT_USER:
    case REQUEST_CURRENT_USER:
      // This user object on request won't have market presences but better than nothing
      return action.user ? action.user : state;
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
