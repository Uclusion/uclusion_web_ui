import { combineReducers } from 'redux';
import { COMMENTS_LIST_RECEIVED, COMMENT_CREATED } from './actions';
import _ from 'lodash';

function investibleComments(state = {}, action) {
  switch (action.type) {
    case COMMENTS_LIST_RECEIVED:
      const { investible_id, comments } = action.comments;
      const listState = { ...state };
      listState[investible_id] = comments;
      return listState;
    case COMMENT_CREATED:
      const { investibleId, comment } = action;
      const createState = { ...state};
      createState[investibleId].push(comment);
      return createState;
    default:
      return state;
  }
}

export function getComments(state) {
  return state.investibleComments;
}

export default combineReducers({ investibleComments });
