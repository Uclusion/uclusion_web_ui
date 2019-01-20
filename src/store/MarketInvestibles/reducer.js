import { combineReducers } from 'redux'
import PropTypes from 'prop-types'
import _ from 'lodash'
import {
  REQUEST_INVESTIBLES,
  RECEIVE_INVESTIBLES,
  INVESTMENT_CREATED,
  formatInvestibles,
  INVESTIBLE_CREATED, MARKET_INVESTIBLE_CREATED, MARKET_INVESTIBLE_DELETED
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
    case MARKET_INVESTIBLE_DELETED:
      return state.filter(item => item.id !== action.investibleId)
    case INVESTMENT_CREATED:
    case MARKET_INVESTIBLE_CREATED:
      const investment = action.investment
      const marketInvestible = action.marketInvestible
      const investibleId = marketInvestible ? marketInvestible.investible_id : investment.investible_id
      let findInvestibleId = marketInvestible ? marketInvestible.copiedInvestibleId : investibleId
      let investible = state.find((element) => element.id === findInvestibleId)
      let investibleCopy
      if (marketInvestible) {
        // This is a bind to market
        investibleCopy = {...investible, ...marketInvestible}
      } else {
        investibleCopy = {...investible}
      }
      investibleCopy.id = investibleId
      investibleCopy.quantity = investment ? investment.investible_quantity : 0
      investibleCopy.current_user_investment = investment ? investment.current_user_investment : 0
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
})
