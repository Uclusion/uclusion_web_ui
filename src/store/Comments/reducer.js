import { combineReducers } from 'redux';
import _ from 'lodash';
import { COMMENT_CREATED, COMMENTS_RECEIVED, COMMENT_DELETED } from './actions';
import { arrayToMappedSubArrays } from '../../utils/arrays';

export function updateCommentListState(state, action) {
  const { marketId, comments } = action;
  const newState = { ...state };
  const byInvestible = arrayToMappedSubArrays(comments, item => item.investible_id);
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

function marketComments(state = {}, action) {
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
  return state.marketComments;
}

export default combineReducers({ marketComments });
