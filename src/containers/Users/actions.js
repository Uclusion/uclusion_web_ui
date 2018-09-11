import config from '../../config/config'
import uclusion from 'uclusion_sdk'
import { fetchMarket } from '../Markets/actions'

export const REQUEST_USER = 'REQUEST_USER'
export const RECEIVE_USER = 'RECEIVE_USER'
export const RECEIVE_CURRENT_USER = 'RECEIVE_CURRENT_USER'

export const requestUser = () => ({
  type: REQUEST_USER
})

export const receiveUser = user => ({
  type: RECEIVE_USER,
  user
})

export const receiveCurrentUser = user => ({
  type: RECEIVE_CURRENT_USER,
  user
})

export const fetchUser = (params = {}) => (dispatch) => {
  dispatch(requestUser())
  // TODO either constructClient must cache the client or we have to at the upper level
  uclusion.constructClient(config.api_configuration).then((client) => {
    return client.users.get(params.user_id)
  }).then((user) => {
    if (!params.user_id) {
      dispatch(receiveCurrentUser(user))
    }
    if (params.dispatchFirstMarketId && user.market_presences.length > 0) {
      dispatch(fetchMarket({market_id: user.market_presences[0].market_id, isSelected: true}))
    }
    return dispatch(receiveUser(user))
  }).catch((error) => {
    console.log(error)
    dispatch(receiveUser([]))
  })
}

const formatUser = (user) => {
  user.created_at = new Date(user.created_at)
  user.updated_at = new Date(user.updated_at)
  return user
}

export const formatUsers = (users) => {
  users.forEach((users) => {
    formatUser(users)
  })
  return users
}
