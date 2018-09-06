import { combineReducers } from 'redux'
import PropTypes from 'prop-types'
import _ from 'lodash'
import { REQUEST_INVESTIBLES, RECEIVE_INVESTIBLES } from './actions'

export const investiblePropType = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  market_id: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  categories: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  quantity: PropTypes.number.isRequired,
  investment_in_window1: PropTypes.number.isRequired,
  closed: PropTypes.bool.isRequired,
  created_at: PropTypes.instanceOf(Date).isRequired,
  updated_at: PropTypes.instanceOf(Date).isRequired,
  last_investment_at: PropTypes.instanceOf(Date).isRequired
})

const items = (state = [], action) => {
  switch (action.type) {
    case REQUEST_INVESTIBLES:
      return state
    case RECEIVE_INVESTIBLES:
      let investibles = action.investibles
      if (!Array.isArray(investibles)) {
        investibles = [investibles]
      }
      return _.unionBy(investibles, state, 'id')
    default:
      return state
  }
}

const isFetching = (state = 0, action) => {
  switch (action.type) {
    case REQUEST_INVESTIBLES:
      return state + 1
    case RECEIVE_INVESTIBLES:
      return state - 1
    default:
      return state
  }
}

export const getInvestibles = (state) => {
  return state.items
}

export const getInvestiblesFetching = state => state.isFetching

export default combineReducers({
  items,
  isFetching
})
