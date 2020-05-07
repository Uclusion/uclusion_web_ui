import { fixupItemsForStorage, } from '../ContextUtils'
import _ from 'lodash'
import { overwriteMarketComments, removeCommentsFromMarket } from './commentsContextReducer'
import { pushMessage } from '../../utils/MessageBusUtils'
import {
  INDEX_COMMENT_TYPE,
  INDEX_UPDATE,
  SEARCH_INDEX_CHANNEL
} from '../SearchIndexContext/searchIndexContextMessages'
import { addVersionRequirement } from '../VersionsContext/versionsContextReducer'

export function getComment(state, marketId, commentId) {
  const marketComments = getMarketComments(state, marketId);
  return marketComments.find(comment => comment.id === commentId);
}

export function getCommentRoot(state, marketId, commentId) {
  const comment = getComment(state, marketId, commentId);
  console.log(comment);
  if (_.isEmpty(comment)) {
    return undefined;
  }
  //we're the root, return us
  if (_.isEmpty(comment.reply_id)) {
    return comment;
  }
  // we're an internal node, go up the tree
  return getCommentRoot(state, marketId, comment.reply_id);
}

export function getMarketComments(state, marketId) {
  return state[marketId] || [];
}

/**
 * Comment removal is top level. The replies won't show once orphaned and will be cleaned up by async.
 * @param dispatch
 * @param marketId
 * @param comments
 */
export function removeComments(dispatch, marketId, comments) {
  dispatch(removeCommentsFromMarket(marketId, comments));
}

export function addCommentToMarket(comment, state, dispatch, versionsDispatch) {
  addVersionRequirement(versionsDispatch, { id: comment.id, version: comment.version});
  let updates = [comment];
  const { reply_id: replyId, id, market_id: marketId } = comment;
  const comments = getMarketComments(state, marketId);
  if (!_.isEmpty(replyId)) {
    const parent = comments.find((comment) => comment.id === replyId);
    if (!_.isEmpty(parent)) {
      const { children } = parent;
      const newChildren = !_.isEmpty(children)? [...children, id] : [id];
      const uniqueNewChildren = _.uniq(newChildren);
      const newParent = {
        ...parent,
        children: uniqueNewChildren,
      };
      updates.push(newParent)
    }
  }
  pushMessage(SEARCH_INDEX_CHANNEL, { event: INDEX_UPDATE, itemType: INDEX_COMMENT_TYPE, items: updates});
  const merged = _.unionBy(updates, comments, 'id');
  dispatch(overwriteMarketComments(marketId, fixupItemsForStorage(merged)));
}

export function refreshMarketComments(dispatch, marketId, comments) {
  const fixedUp = fixupItemsForStorage(comments);
  // We are free to overwrite here because the required version is protecting quick add comments
  dispatch(overwriteMarketComments(marketId, fixedUp));
}
