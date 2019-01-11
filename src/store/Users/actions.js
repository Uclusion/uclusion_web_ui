import { getClient } from '../../config/uclusionClient'
import { fetchMarket } from '../Markets/actions'

export const REQUEST_USER = 'REQUEST_USER'
export const REQUEST_CURRENT_USER = 'REQUEST_CURRENT_USER'
export const RECEIVE_USER = 'RECEIVE_USER'
export const RECEIVE_CURRENT_USER = 'RECEIVE_CURRENT_USER'

export const requestUser = () => ({
  type: REQUEST_USER
})


export const requestCurrentUser = () => ({
  type: REQUEST_CURRENT_USER
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
  if (!params.user_id){
    dispatch(requestCurrentUser())
  } else {
    dispatch(requestUser())
  }
  const clientPromise = getClient()
  return clientPromise.then((client) => {
    return client.users.get(params.user_id, params.marketId)
  }).then((user) => {
    if (!params.user_id) {
      dispatch(receiveCurrentUser(user))
    } else {
      return dispatch(receiveUser(user))
    }
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
