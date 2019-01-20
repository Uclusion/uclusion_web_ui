import { fetchUser } from '../Users/actions'
import { getClient } from '../../config/uclusionClient'
import { sendIntlMessage, ERROR, SUCCESS } from '../../utils/userMessage'

export const REQUEST_INVESTIBLES = 'REQUEST_INVESTIBLES'
export const RECEIVE_INVESTIBLES = 'RECEIVE_INVESTIBLES'
export const INVEST_INVESTIBLE = 'INVEST_INVESTIBLE'
export const INVESTMENT_CREATED = 'INVESTMENT_CREATED'
export const INVESTIBLE_CREATED = 'INVESTIBLE_CREATED'
export const DELETE_MARKET_INVESTIBLE = 'DELETE_MARKET_INVESTIBLE'
export const MARKET_INVESTIBLE_DELETED = 'MARKET_INVESTIBLE_DELETED'
export const MARKET_INVESTIBLE_CREATED = 'MARKET_INVESTIBLE_CREATED'

export const deleteInvestible = (investibleId) => ({
  type: DELETE_MARKET_INVESTIBLE,
  investibleId
})

export const investibleDeleted = (investibleId) => ({
  type: MARKET_INVESTIBLE_DELETED,
  investibleId
})

export const requestInvestibles = () => ({
  type: REQUEST_INVESTIBLES
})

export const receiveInvestibles = investibles => ({
  type: RECEIVE_INVESTIBLES,
  investibles
})

export const investInInvestible = (marketId, teamId, investibleId, quantity) => ({
  type: INVEST_INVESTIBLE,
  investibleId,
  quantity,
  marketId,
  teamId
})

export const investmentCreated = (investment) => ({
  type: INVESTMENT_CREATED,
  investment
})

export const marketInvestibleCreated = (investment, marketInvestible) => ({
  type: MARKET_INVESTIBLE_CREATED,
  investment,
  marketInvestible
})

export const investibleCreated = (investible) => ({
  type: INVESTIBLE_CREATED,
  investible
})

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

const baseFetchInvestibles = (params, dispatch, aFunction) => {
  if (!params.market_id && !params.investibleId) { return }
  dispatch(requestInvestibles())
  const clientPromise = getClient()
  const promise = clientPromise.then((client) => aFunction(client))

  return promise.then(response => dispatch(receiveInvestibles(response)))
    .catch((error) => {
      console.log(error)
      dispatch(receiveInvestibles([]))
    })
}

export const fetchInvestibles = (params = {}) => (dispatch) => {
  console.log('fetch investibles dispatched')
  const singularFetcher = (client) => {
    return client.investibles.get(params.investibleId)
  }
  const multifetcher = (client) => (client.markets.listTrending(params.market_id, params.trending_window_date))
  let fetcher = null
  if (params.investibleId) {
    fetcher = singularFetcher
  } else {
    fetcher = multifetcher
  }
  return baseFetchInvestibles(params, dispatch, (client) => (fetcher(client)))
}

export const fetchCategoriesInvestibles = (params = {}) => (dispatch) => {
  return baseFetchInvestibles(params, dispatch, (params, promise) => {
    return promise.then((client) => {
      return client.markets.listCategoriesInvestibles(params.market_id, params.category, params.page, params.per_page)
    })
  })
}

export const createInvestment = (params = {}) => {
  return (dispatch) => {
    console.log(params)
    dispatch(investInInvestible(params.marketId, params.teamId, params.investibleId, params.quantity))
    const clientPromise = getClient()
    return clientPromise.then((client) => client.markets.createInvestment(params.marketId, params.teamId, params.investibleId, params.quantity))
      .then(investment => {
        dispatch(investmentCreated(investment))
        sendIntlMessage(SUCCESS, {id: 'investmentSucceeded'}, {shares: params.quantity})
        dispatch(fetchUser({marketId: params.marketId}))
      }).catch((error) => {
        console.error(error)
        sendIntlMessage(ERROR, {id: 'investmentFailed'})
        dispatch(investmentCreated([]))
      })
  }
}

export const createNewBoundInvestible = (params = {}) => {
  return (dispatch) => {
    const clientPromise = getClient()
    return clientPromise.then((client) => {
      if (params.canInvest) {
        return client.markets.investAndBind(params.marketId, params.teamId, params.investibleId, params.quantity, params.categoryList)
      }
      return client.investibles.bindToMarket(params.investibleId, params.marketId, params.categoryList)
    }).then((response) => {
      let investible = response.investible ? response.investible : response
      investible.copiedInvestibleId = params.investibleId
      dispatch(marketInvestibleCreated(response.investment, investible))
      sendIntlMessage(SUCCESS, {id: 'investibleAddSucceeded'})
      dispatch(fetchUser({marketId: params.marketId}))
    }).catch((error) => {
      console.error(error)
      sendIntlMessage(ERROR, {id: 'investibleBindFailed'})
    })
  }
}

export const createMarketInvestible = (params = {}) => (dispatch) => {
  const clientPromise = getClient()
  return clientPromise.then((client) => client.investibles.create(params.title, params.description))
    .then(investible => {
      dispatch(investibleCreated(investible))
      // inform the invest they need to fetch the new market investible
      const payload = {
        marketId: params.marketId,
        teamId: params.teamId,
        investibleId: investible.id,
        quantity: 1,
        categoryList: [params.category],
        canInvest: params.canInvest
      }
      dispatch(createNewBoundInvestible(payload))
    }).catch((error) => {
      console.log(error)
      sendIntlMessage(ERROR, {id: 'investibleAddFailed'})
      dispatch(investibleCreated([]))
    })
}

export const deleteMarketInvestible = (params = {}) => (dispatch) => {
  const investibleId = params
  dispatch(deleteInvestible(investibleId))
  const clientPromise = getClient()
  return clientPromise.then((client) => client.investibles.delete(investibleId))
    .then((deleted) => {
      dispatch(investibleDeleted(investibleId))
      sendIntlMessage(SUCCESS, { id: 'marketInvestibleDeleted' })
    }).catch((error) => {
      console.log(error)
      sendIntlMessage(ERROR, { id: 'marketInvestibleDeleteFailed' })
    })
}
