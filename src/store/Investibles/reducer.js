import { combineReducers } from 'redux'
import PropTypes from 'prop-types'
import _ from 'lodash'
import { REQUEST_INVESTIBLES, RECEIVE_INVESTIBLES, INVESTMENT_CREATED, INVESTIBLE_CREATED, formatInvestibles } from './actions'

const items = (state = [], action) => {
  switch (action.type) {
    default:
      return state
  }
}

const isFetching = (state = 0, action) => {
  switch (action.type) {
    default:
      return state
  }
}

export const getInvestibles = (state) => {
  return formatInvestibles(state.items)
}

export const getInvestiblesFetching = state => state.isFetching

export default combineReducers({
  items,
  isFetching
});
