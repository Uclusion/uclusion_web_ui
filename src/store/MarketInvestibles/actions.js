import { fetchUser } from '../Users/actions'
import { getClient } from '../../config/uclusionClient'
import { sendIntlMessage, ERROR, SUCCESS } from '../../utils/userMessage'
import _ from 'lodash'

export const RECEIVE_INVESTIBLES = 'RECEIVE_INVESTIBLES'
export const INVEST_INVESTIBLE = 'INVEST_INVESTIBLE'
export const INVESTMENT_CREATED = 'INVESTMENT_CREATED'
export const INVESTIBLE_CREATED = 'INVESTIBLE_CREATED'
export const DELETE_MARKET_INVESTIBLE = 'DELETE_MARKET_INVESTIBLE'
export const MARKET_INVESTIBLE_DELETED = 'MARKET_INVESTIBLE_DELETED'
export const MARKET_INVESTIBLE_CREATED = 'MARKET_INVESTIBLE_CREATED'

export const REQUEST_MARKET_INVESTIBLE_LIST = 'REQUEST_MARKET_INVESTIBLE_LIST'
export const RECEIVE_MARKET_INVESTIBLE_LIST = 'RECEIVE_MARKET_INVESTIBLE_LIST'

export const deleteInvestible = (investibleId) => ({
  type: DELETE_MARKET_INVESTIBLE,
  investibleId
})

export const investibleDeleted = (investibleId) => ({
  type: MARKET_INVESTIBLE_DELETED,
  investibleId
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

export const investibleListRequested = (marketId) => ({
  type: REQUEST_MARKET_INVESTIBLE_LIST,
  marketId
})

export const investibleListReceived = (marketId, investibleList) => ({
  type: RECEIVE_MARKET_INVESTIBLE_LIST,
  marketId,
  investibleList
})

const determineNeedsUpdate = (currentInvestibles, investibleList) => {
  const currentHash = _.keyBy(currentInvestibles, (item) => item.id)
  const updateNeeded = _.filter(investibleList, (item) => {
    const stateVersion = currentHash[item.id]
    return !stateVersion || (stateVersion.updated_at < new Date(item.updated_at))
  })
  return updateNeeded.map((item) => item.id)
}

export const fetchInvestibleList = (params = {}) => {
  return (dispatch) => {
    const { marketId, currentInvestibleList } = params
    const clientPromise = getClient()
    return clientPromise.then((client) => client.markets.listInvestibles(marketId))
      .then(investibleList => {
        dispatch(investibleListReceived(marketId, investibleList))
        const needsUpdate = determineNeedsUpdate(currentInvestibleList, investibleList)
        const chunks = _.chunk(needsUpdate, 50)
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i]
          dispatch(fetchInvestibles({marketId, idList: chunk}))
        }
      }).catch(error => {
        console.error(error)
        sendIntlMessage(ERROR, { id: 'investibleListFetchFailed' })
      })
  }
}

export const fetchInvestibles = (params = {}) => {
  return (dispatch) => {
    const { idList, marketId } = params
    const clientPromise = getClient()
    return clientPromise.then((client) => client.markets.getMarketInvestibles(marketId, idList)).then((investibles) => {
      dispatch(receiveInvestibles(investibles))
    }).catch(error => {
      console.error(error)
      sendIntlMessage(ERROR, {id: 'investibleFetchFailed'})
    })
  }
}

export const createInvestment = (params = {}) => {
  return (dispatch) => {
    dispatch(investInInvestible(params.marketId, params.teamId, params.investibleId, params.quantity))
    const clientPromise = getClient()
    return clientPromise.then((client) => client.markets.createInvestment(params.marketId, params.teamId, params.investibleId, params.quantity))
      .then(investment => {
        dispatch(investmentCreated(investment))
        sendIntlMessage(SUCCESS, { id: 'investmentSucceeded' }, { shares: params.quantity })
        dispatch(fetchUser({ marketId: params.marketId }))
      }).catch(error => {
        console.error(error)
        sendIntlMessage(ERROR, { id: 'investibleListFetchFailed' })
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
      sendIntlMessage(SUCCESS, { id: 'investibleAddSucceeded' })
      dispatch(fetchUser({ marketId: params.marketId }))
    }).catch((error) => {
      console.error(error)
      sendIntlMessage(ERROR, { id: 'investibleBindFailed' })
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
      sendIntlMessage(ERROR, { id: 'investibleAddFailed' })
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
