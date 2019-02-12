import { combineReducers } from 'redux';
import { COMMENTS_LIST_RECEIVED } from './actions';


function investibleComments(state = {}, action) {
  switch (action.type) {
    case COMMENTS_LIST_RECEIVED:
      const { investible_id, comments } = action.comments;
      const newState = { ...state };
      newState[investible_id] = comments;
      return newState;
    default:
      return state;
  }
}

export function getComments(state) {
  return state.investibleComments;
}

export default combineReducers({ investibleComments });
