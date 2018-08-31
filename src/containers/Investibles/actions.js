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

export const fetchInvestibles = (params = {}) => (dispatch) => {
  dispatch(requestInvestibles())

  let promise = uclusion.constructClient(config.api_configuration)
  if (params && params.id) {
    promise = promise.then((client) => {
      return client.markets.getMarketInvestible('slack_TB424K1GD', params.id)
    })
  } else {
    promise = promise.then((client) => {
      return client.markets.listTrending('slack_TB424K1GD', '2015-01-22T03:23:26Z')
    })
  }

  return promise.then(response => dispatch(receiveInvestibles(response)))
    .catch(() => {
      dispatch(receiveInvestibles([]))
    })
}
