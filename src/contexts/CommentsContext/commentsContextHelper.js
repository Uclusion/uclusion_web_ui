import {
  fixupItemsForStorage,
} from '../ContextUtils';
import _ from 'lodash';
import LocalForageHelper from '../LocalForageHelper';
import { COMMENTS_CONTEXT_NAMESPACE, EMPTY_STATE } from './CommentsContext';
import { removeCommentsFromMarket, updateMarketComments } from './commentsContextReducer';


export function getMarketComments(state, marketId) {
  return state[marketId] || [];
}

/**
 * Comment removal is really an investment comment thing,
 * so we're not going to handle the case of comment threads etc.
 * That will probably have to be modeld by an overwrite of contents.
 * Or we will plain not support it
 * @param dispatch
 */
export function removeComments(dispatch, marketId, comments) {
  dispatch(removeCommentsFromMarket(marketId, comments));
}

export function refreshMarketComments(dispatch, marketId, comments) {
  const lfh = new LocalForageHelper(COMMENTS_CONTEXT_NAMESPACE);
  //TODO: We should just make the reducer handle this state instead of reading from local forage
  return lfh.getState()
    .then((state) => {
      const usedState = state || EMPTY_STATE;
      const oldMarketComments = getMarketComments(usedState, marketId);
      const fixedUp = fixupItemsForStorage(comments);
      const newMarketComments = _.unionBy(fixedUp, oldMarketComments, 'id');
      dispatch(updateMarketComments(marketId, newMarketComments));
    });
}

export function checkIfCommentInStorage(marketId, commentId) {
  const lfh = new LocalForageHelper(COMMENTS_CONTEXT_NAMESPACE);
  return lfh.getState()
    .then((state) => {
      const usedState = state || EMPTY_STATE;
      const marketComments = usedState[marketId] || [];
      return !!marketComments.find((comment) => comment.id === commentId);
    });
}
