import { combineReducers } from 'redux';
import { COMMENT_CREATED, COMMENTS_RECEIVED, COMMENT_DELETED } from './actions';
import _ from 'lodash';

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
  const { marketId, comments } = action.comments;
  const formatted = reFormatComments(comments);
  const newState = { ...state };
  const byInvestible = _.keyBy(formatted, item => item.investible_id);
  const marketList = newState[marketId] || {};
  Object.keys(byInvestible).forEach((investibleId) => {
    const oldList = marketList[investibleId] || [];
    marketList[investibleId] = _.unionBy(byInvestible[investibleId], oldList, 'id');
  });
  newState[marketId] = marketList;
  return newState;
}

function deleteSingleCommentState(state, action) {
  const { commentId, investibleId, marketId } = action;
  const newState = { ...state };
  const marketList = newState[marketId];
  if (marketList && marketList[investibleId]) {
    marketList[investibleId] = _.filter(marketList[investibleId], comment => (comment.id !== commentId));
    newState[marketId] = marketList;
  }
  return newState;
}

function investibleComments(state = {}, action) {
  switch (action.type) {
    case COMMENTS_RECEIVED:
    case COMMENT_CREATED:
      return updateCommentListState(state, action);
    case COMMENT_DELETED:
      return deleteSingleCommentState(state, action);
    default:
      return state;
  }
}

export function getComments(state) {
  return state.investibleComments;
}

export default combineReducers({ investibleComments });
