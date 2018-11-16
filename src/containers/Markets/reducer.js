import { combineReducers } from 'redux'
import PropTypes from 'prop-types'
import _ from 'lodash'
import { REQUEST_MARKET, RECEIVE_MARKET, SELECT_MARKET, REQUEST_MARKET_CATEGORIES, RECEIVE_MARKET_CATEGORIES, formatMarkets } from './actions'

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
  updated_at: PropTypes.instanceOf(Date).isRequired
})

export const teamsPropType = PropTypes.shape({
  id: PropTypes.string.isRequired,
  

})

const marketItems = (state = [], action) => {
  switch (action.type) {
    case REQUEST_MARKET:
      return state;
    case RECEIVE_MARKET:
      let market = [action.market];
      return _.unionBy(market, state, 'id');
    default:
      return state;
  }
}

const isMarketFetching = (state = 0, action) => {
  switch (action.type) {
    case REQUEST_MARKET:
      return state + 1;
    case RECEIVE_MARKET:
      return state - 1;
    default:
      return state;
  }
}

const currentMarketId = (state = null, action) => {
  switch (action.type) {
    case SELECT_MARKET:
      return action.marketId;
    default:
      return state;
  }
}

const isCategoriesFetching = (state = 0, action) => {
  switch(action.type) {
    case REQUEST_MARKET_CATEGORIES:
      return state + 1;
    case RECEIVE_MARKET_CATEGORIES:
      return state - 1;
    default:
      return state;
  }
}

const marketCategories = (state ={} , action) => {
  switch(action.type) {
    case RECEIVE_MARKET_CATEGORIES:
      const newState = { ...state };
      newState[action.categories.market_id] = action.categories.categories;
      return newState;
    default:
      return state
  }
}

export const getMarkets = (state) => {
  return formatMarkets(state.marketItems)
}

export const getMarketCategories = (state) => {
  return state.marketCategories
}

export const getMarketsFetching = state => state.isMarketFetching
export const getCategoriesFetching = state => state.isCategoriesFetching


export const getCurrentMarketId = (state) => {
  return state.currentMarketId
}

export default combineReducers({
  marketItems,
  isMarketFetching,
  isCategoriesFetching,
  marketCategories,
  currentMarketId
})
