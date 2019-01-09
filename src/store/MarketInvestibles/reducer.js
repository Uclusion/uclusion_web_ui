import { combineReducers } from 'redux'
import PropTypes from 'prop-types'
import _ from 'lodash'
import {
  REQUEST_INVESTIBLES,
  RECEIVE_INVESTIBLES,
  INVESTMENT_CREATED,
  formatInvestibles,
  INVESTIBLE_CREATED
} from './actions'

export const investiblePropType = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  market_id: PropTypes.string,
  description: PropTypes.string.isRequired,
  category_list: PropTypes.arrayOf(PropTypes.string),
  quantity: PropTypes.number,
  investment_in_window1: PropTypes.number,
  created_at: PropTypes.instanceOf(Date),
  updated_at: PropTypes.instanceOf(Date),
  last_investment_at: PropTypes.instanceOf(Date),
  current_user_investment: PropTypes.number
})

const items = (state = [], action) => {
  switch (action.type) {
    case REQUEST_INVESTIBLES:
      return state
    case RECEIVE_INVESTIBLES:
    case INVESTIBLE_CREATED:
      let investibles = action.investibles ? action.investibles : action.investible
      if (!Array.isArray(investibles)) {
        investibles = [investibles]
      }
      return _.unionBy(investibles, state, 'id')
    case INVESTMENT_CREATED:
      const investment = action.investment
      let investible = state.find((element) => element.id === investment.investible_id)
      // if we're not yet in the investible list, don't bother fetching us. We'll get it later
      if (!investible) {
        return state
      }
      let investibleCopy = {...investible}
      investibleCopy.quantity = investment.investible_quantity
      if (investment.categoryList) {
        // This is a bind to market
        investibleCopy.category_list = investment.categoryList
      }
      investibleCopy.current_user_investment = investment.current_user_investment
      return _.unionBy([investibleCopy], state, 'id')
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
  return formatInvestibles(state.items)
}

export const getInvestiblesFetching = state => state.isFetching

export default combineReducers({
  items,
  isFetching
});
