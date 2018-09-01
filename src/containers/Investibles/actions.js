import config from '../../config/config'
import uclusion from 'uclusion_sdk'

export const REQUEST_INVESTIBLES = 'REQUEST_INVESTIBLES'
export const RECEIVE_INVESTIBLES = 'RECEIVE_INVESTIBLES'

export const requestInvestibles = () => ({
  type: REQUEST_INVESTIBLES
})

export const receiveInvestibles = investibles => ({
  type: RECEIVE_INVESTIBLES,
  investibles
})

const baseFetchInvestibles = (params, dispatch, aFunction) => {
  dispatch(requestInvestibles())

  // TODO either constructClient must cache the client or we have to at the upper level
  let promise = uclusion.constructClient(config.api_configuration)
  promise = aFunction(params, promise)

  return promise.then(response => dispatch(receiveInvestibles(response)))
    .catch((error) => {
      console.log(error)
      dispatch(receiveInvestibles([]))
    })
}

export const fetchInvestibles = (params = {}) => (dispatch) => {
  return baseFetchInvestibles(params, dispatch, (params, promise) => {
    if (params && params.id) {
      promise = promise.then((client) => {
        return client.markets.getMarketInvestible(params.market_id, params.id)
      })
    } else {
      promise = promise.then((client) => {
        return client.markets.listTrending(params.market_id, params.trending_window_date)
      })
    }
    return promise
  })
}

export const fetchCategoriesInvestibles = (params = {}) => (dispatch) => {
  return baseFetchInvestibles(params, dispatch, (params, promise) => {
    promise = promise.then((client) => {
      return client.markets.listCategoriesInvestibles(params.market_id, params.category, params.page, params.per_page)
    })
    return promise
  })
}
