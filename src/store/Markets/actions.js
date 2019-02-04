import { getClient } from '../../config/uclusionClient'
import { ERROR, sendIntlMessage, SUCCESS } from '../../utils/userMessage'

export const REQUEST_MARKET = 'REQUEST_MARKET'
export const RECEIVE_MARKET = 'RECEIVE_MARKET'
export const SELECT_MARKET = 'SELECT_MARKET'
export const REQUEST_MARKET_CATEGORIES = 'REQUEST_MARKET_CATEGORIES'
export const RECEIVE_MARKET_CATEGORIES = 'RECEIVE_MARKET_CATEGORIES'
export const MARKET_CATEGORY_DELETED = 'MARKET_CATEGORY_DELETED'
export const MARKET_CATEGORY_CREATED = 'MARKET_CATEGORY_CREATED'

export const requestMarket = () => ({
  type: REQUEST_MARKET
})

export const receiveMarket = market => ({
  type: RECEIVE_MARKET,
  market
})

export const selectMarket = marketId => ({
  type: SELECT_MARKET,
  marketId
})

export const requestMarketCategories = (marketId) => ({
  type: REQUEST_MARKET_CATEGORIES,
  marketId
})

export const receiveMarketCategories = (categories) => ({
  type: RECEIVE_MARKET_CATEGORIES,
  categories
})

export const categoryDeleted = (name, marketId) => ({
  type: MARKET_CATEGORY_DELETED,
  name,
  marketId
})

export const categoryCreated = (category, marketId) => ({
  type: MARKET_CATEGORY_CREATED,
  category,
  marketId
})

export const fetchMarketCategories = (params = {}) => (dispatch) => {
  dispatch(requestMarketCategories(params.marketId))
  const clientPromise = getClient()
  console.log('Fetching market categories')
  return clientPromise.then((client) => {
    return client.markets.listCategories(params.marketId)
  }).then((categories) => {
    dispatch(receiveMarketCategories(categories))
  }).catch((error) => {
    console.log(error)
    dispatch(receiveMarketCategories({}))
  })
}

export const deleteMarketCategory = (params = {}) => (dispatch) => {
  const clientPromise = getClient()
  return clientPromise.then((client) => client.investibles.deleteCategory(params.name, params.marketId))
    .then((deleted) => {
      dispatch(categoryDeleted(params.name, params.marketId))
      sendIntlMessage(SUCCESS, { id: 'marketCategoryDeleted' })
    }).catch((error) => {
      console.log(error)
      sendIntlMessage(ERROR, { id: 'marketCategoryDeleteFailed' })
    })
}

export const createMarketCategory = (params = {}) => (dispatch) => {
  const clientPromise = getClient()
  return clientPromise.then((client) => client.investibles.createCategory(params.name, params.marketId))
    .then((category) => {
      category.investiblesIn = 0
      dispatch(categoryCreated(category, params.marketId))
      sendIntlMessage(SUCCESS, { id: 'marketCategoryCreated' })
    }).catch((error) => {
      console.log(error)
      sendIntlMessage(ERROR, { id: 'marketCategoryCreateFailed' })
    })
}

export const fetchMarket = (params = {}) => (dispatch) => {
  dispatch(requestMarket())
  if (params.isSelected) {
    dispatch(selectMarket(params.market_id))
  }
  // TODO either constructClient must cache the client or we have to at the upper level
  const clientPromise = getClient()
  return clientPromise.then((client) => {
    return client.markets.get(params.market_id)
  }).then((market) => {
    dispatch(receiveMarket(market))
    return dispatch(fetchMarketCategories({marketId: market.id}))
  }).catch((error) => {
    console.log(error)
    dispatch(receiveMarket([]))
  })
}

const formatMarket = (market) => {
  market.created_at = new Date(market.created_at)
  market.updated_at = new Date(market.updated_at)
  return market
}

export const formatMarkets = (markets) => {
  markets.forEach((market) => {
    formatMarket(market)
  })
  return markets
}
