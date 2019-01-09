import { combineReducers } from 'redux'
import { formatInvestibles } from './actions'

const items = (state = [], action) => {
  switch (action.type) {
    default:
      return state
  }
}

const isFetching = (state = 0, action) => {
  switch (action.type) {
    default:
      return state
  }
}

export const getInvestibles = (state) => {
  return formatInvestibles(state.items)
}

export const getInvestiblesFetching = state => state.isFetching

export default combineReducers({
  items,
  isFetching
})
