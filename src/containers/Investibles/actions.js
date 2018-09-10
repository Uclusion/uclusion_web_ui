import config from '../../config/config'
import uclusion from 'uclusion_sdk'

export const REQUEST_INVESTIBLES = 'REQUEST_INVESTIBLES'
export const RECEIVE_INVESTIBLES = 'RECEIVE_INVESTIBLES'
export const INVEST_INVESTIBLE = 'INVEST_INVESTIBLE'
export const INVESTMENT_CREATED = 'INVESTMENT_CREATED'

export const requestInvestibles = () => ({
  type: REQUEST_INVESTIBLES
})

export const receiveInvestibles = investibles => ({
  type: RECEIVE_INVESTIBLES,
  investibles
})


export const investInInvestible = (marketId, investibleId, quantity) => ({
  type: INVEST_INVESTIBLE,
  investibleId,
  quantity,
  marketId
})

export const investmentCreated = (investment) => ({
  type: INVESTMENT_CREATED,
  investment
})



const baseFetchInvestibles = (params, dispatch, aFunction) => {
  if (!params.market_id) { return }
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

const formatInvestible = (investible) => {
  investible.created_at = new Date(investible.created_at)
  investible.updated_at = new Date(investible.updated_at)
  investible.last_investment_at = new Date(investible.last_investment_at)
  return investible
}

export const formatInvestibles = (investibles) => {
  investibles.forEach((investible) => {
    formatInvestible(investible)
  })
  return investibles
}

export const fetchInvestibles = (params = {}) => (dispatch) => {
  return baseFetchInvestibles(params, dispatch, (params, promise) => {
    if (params && params.id) {
      return promise.then((client) => {
        return client.markets.getMarketInvestible(params.market_id, params.id)
      })
    } else {
      return promise.then((client) => {
        return client.markets.listTrending(params.market_id, params.trending_window_date)
      })
    }
  })
}

export const fetchCategoriesInvestibles = (params = {}) => (dispatch) => {
  return baseFetchInvestibles(params, dispatch, (params, promise) => {
    return promise.then((client) => {
      return client.markets.listCategoriesInvestibles(params.market_id, params.category, params.page, params.per_page)
    })
  })
}


export const createInvestment = (params = {}) => (dispatch) => {
  dispatch(investInInvestible(params.marketId, params.investibleId, params.quantity))
  uclusion.constructClient(config.api_configuration).then((client) => {
    return client.markets.createInvestment(params.marketId, params.investibleId, params.quantity)
  }).then(investment => dispatch(investmentCreated(investment)))
    .catch((error) => {
      console.log(error)
      dispatch(investmentCreated([]))
    })
}

