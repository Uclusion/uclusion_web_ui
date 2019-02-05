import { combineReducers } from 'redux'
import { formatInvestibles } from './actions'

const items = (state = [], action) => {
  switch (action.type) {
    default:
      return state
  }
}

export const getInvestibles = (state) => {
  return formatInvestibles(state.items)
}

export default combineReducers({
  items
})
