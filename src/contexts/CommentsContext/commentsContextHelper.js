import {
  fixupItemsForStorage,
} from '../ContextUtils';
import _ from 'lodash';
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

export function addCommentToMarket(comment, state, dispatch) {
  let updates = [comment];
  const { reply_id: replyId, id, market_id: marketId } = comment;
  const comments = getMarketComments(state, marketId);
  if (!_.isEmpty(replyId)) {
    const parent = comments.find((comment) => comment.id === replyId);
    if (!_.isEmpty(parent)) {
      const { children } = parent;
      const newChildren = !_.isEmpty(children)? [...children, id] : [id];
      const newParent = {
        ...parent,
        children: newChildren,
      };
      updates.push(newParent)
    }
  }
  const merged = _.unionBy(updates, comments, 'id');
  refreshMarketComments(dispatch, marketId, merged);
}

export function refreshMarketComments(dispatch, marketId, comments) {
  const fixedUp = fixupItemsForStorage(comments);
  dispatch(updateMarketComments(marketId, fixedUp));
}
