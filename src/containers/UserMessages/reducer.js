import { combineReducers } from 'redux'
import PropTypes from 'prop-types'

/** Right now we'll only accept one message, so we don't have to have a queue. This is actually in accordance with MUI theme guides. Though it would be hard to handle transitions -see fade out transition */

import { DISPLAY_MESSAGE } from './actions'

const userMessages = (state = [], action){
  switch(action.type){
    case DISPLAY_MESSAGE:
      return [{level: action.level, message: action.message}]
    default:
      return state
  }
}

export const getUserMessages = (state) => state.userMessages

export default combineReducers(userMessages)