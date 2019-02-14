import { combineReducers } from 'redux';
import { COMMENTS_LIST_RECEIVED, COMMENT_CREATED, COMMENT_RECEIVED } from './actions';

const reFormatComment = (comment) => {
  comment.created_at = new Date(comment.created_at);
  comment.updated_at = new Date(comment.updated_at);
  return comment;
};

function reFormatComments(items) {
  items.forEach((comment) => {
    reFormatComment(comment);
  });
  return items;
}

function updateCommentListState(state, action) {
  const { investible_id, comments } = action.comments;
  const newState = { ...state };
  const formatted = reFormatComments(comments);
  newState[investible_id] = formatted;
  return newState;
}

function updateSingleCommentState(state, action) {
  const { comment } = action;
  const newState = { ...state };
  const formatted = reFormatComment(comment);
  newState[comment.investible_id].push(formatted);
  return newState;
}

function investibleComments(state = {}, action) {
  switch (action.type) {
    case COMMENTS_LIST_RECEIVED:
      return updateCommentListState(state, action);
    case COMMENT_RECEIVED:
    case COMMENT_CREATED:
      return updateSingleCommentState(state, action);
    default:
      return state;
  }
}

export function getComments(state) {
  return state.investibleComments;
}

export default combineReducers({ investibleComments });
