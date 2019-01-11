import { combineReducers } from 'redux'
import PropTypes from 'prop-types'
import _ from 'lodash'
import { REQUEST_USER, RECEIVE_USER, RECEIVE_CURRENT_USER, REQUEST_CURRENT_USER, formatUsers } from './actions'

export const userPropType = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  account_id: PropTypes.string.isRequired,
  market_presences: PropTypes.arrayOf(PropTypes.shape({
    quantity: PropTypes.number.isRequired,
    market_id: PropTypes.string.isRequired,
    market_permissions: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
    market_name: PropTypes.string.isRequired,
    following: PropTypes.bool.isRequired
  }).isRequired),
  created_at: PropTypes.instanceOf(Date).isRequired,
  updated_at: PropTypes.instanceOf(Date).isRequired
})

const userItems = (state = [], action) => {
  switch (action.type) {
    case REQUEST_USER:
      return state
    case RECEIVE_USER:
      let user = [action.user]
      return _.unionBy(user, state, 'id')
    default:
      return state;
  }
}

const isUserFetching = (state = 0, action) => {
  switch (action.type) {
    case REQUEST_USER:
      return state + 1;
    case RECEIVE_USER:
      return state - 1;
    default:
      return state;
  }
}

const isCurrentUserFetching = (state = 0, action) => {
  switch (action.type) {
    case REQUEST_CURRENT_USER:
      return state + 1;
    case RECEIVE_CURRENT_USER:
      return state - 1;
    default:
      return state;
  }
}


const currentUser = (state = null, action) => {
  switch (action.type) {
    case RECEIVE_CURRENT_USER:
      return action.user;
    default:
      return state;
  }
}

export const getUsers = (state) => {
  return formatUsers(state.userItems)
}

export const getUsersFetching = state => state.isUserFetching

export const getCurrentUserFetching = state => state.isCurrentUserFetching

export const getCurrentUser = (state) => {
  return state.currentUser
}

export default combineReducers({
  userItems,
  isUserFetching,
  isCurrentUserFetching,
  currentUser
})
