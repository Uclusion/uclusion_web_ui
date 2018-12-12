import { fetchUser } from '../Users/actions'
import { getClient } from '../../config/uclusionClient'
import { sendIntlMessage, ERROR, SUCCESS} from '../../utils/userMessage'

export const REQUEST_INVESTIBLES = 'REQUEST_INVESTIBLES'
export const RECEIVE_INVESTIBLES = 'RECEIVE_INVESTIBLES'
export const INVEST_INVESTIBLE = 'INVEST_INVESTIBLE'
export const INVESTMENT_CREATED = 'INVESTMENT_CREATED'
export const INVESTIBLE_CREATED = 'INVESTIBLE_CREATED'
export const CREATE_AND_BIND_INVESTIBLE = 'CREATE_AND_BIND_INVESTIBLE'

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

export const investibleCreated = (investible) => ({
  type: INVESTIBLE_CREATED,
  investible
})

//TODO use the ... notation to pass these automagically.
export const createAndBindInvestible = (marketId, title, description, category) => ({
  type: CREATE_AND_BIND_INVESTIBLE,
  marketId,
  title,
  description,
  category
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

  // TODO either constructClient must cache the client or we have to at the upper level
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
        dispatch(fetchUser())
      }).catch((error) => {
        sendIntlMessage(ERROR, {id: 'investmentFailed'})
        dispatch(investmentCreated([]))
        dispatch(fetchUser())
      })
  }
}

export const createNewBoundInvestible = (params = {}) => {
  return (dispatch) => {
    const clientPromise = getClient()
    return clientPromise.then((client) => {
      return client.markets.investAndBind(params.marketId, params.teamId, params.investibleId, params.quantity, params.categoryList)
    }).then((result) => {
      sendIntlMessage(SUCCESS, {id: 'investibleAddSucceeded'})
      dispatch(fetchUser())
    }).catch((error) => {
      sendIntlMessage(ERROR, {id: 'investibleBindFailed'})
      dispatch(fetchUser())
    })
  }
}

export const createMarketInvestible = (params = {}) => (dispatch) => {
  dispatch(createAndBindInvestible(params.marketId, params.title, params.description, params.category))
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
        newInvestible: true,
        categoryList: [params.category]
      }
      dispatch(createNewBoundInvestible(payload))
    }).catch((error) => {
      console.log(error)
      sendIntlMessage(ERROR, {id: 'investibleAddFailed'})
      dispatch(investibleCreated([]))
      dispatch(fetchUser())
    })
}
