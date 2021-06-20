import { fixupItemsForStorage, } from '../ContextUtils'
import _ from 'lodash'
import { overwriteMarketComments, removeCommentsFromMarket } from './commentsContextReducer'
import { pushMessage } from '../../utils/MessageBusUtils'
import {
  INDEX_COMMENT_TYPE,
  INDEX_UPDATE,
  SEARCH_INDEX_CHANNEL
} from '../SearchIndexContext/searchIndexContextMessages'

export function getComment(state, marketId, commentId) {
  const marketComments = getMarketComments(state, marketId);
  return marketComments.find(comment => comment.id === commentId);
}

export function getCommentRoot(state, marketId, commentId) {
  const comment = getComment(state, marketId, commentId);
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

export function getMarketComments(state, marketId, results) {
  const marketComments = state[marketId] || [];
  const notDeleted = marketComments.filter((comment) => !comment.deleted);
  if (_.isEmpty(results)) {
    return notDeleted;
  }
  return notDeleted.filter((comment) => {
    return results.find((item) => item.id === comment.id);
  });
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

export function resolveInvestibleComments(investibleId, marketId, state, dispatch) {
  const comments = getMarketComments(state, marketId);
  const unresolvedComments = comments.filter(comment => comment.investible_id === investibleId &&
    !comment.resolved) || [];
  const resolvedComments = unresolvedComments.map((comment) => {
    return { resolved: true, ...comment };
  });
  refreshMarketComments(dispatch, marketId, resolvedComments);
}

export function addCommentToMarket(comment, state, dispatch) {
  const updates = [comment];
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
  dispatch(overwriteMarketComments(marketId, fixupItemsForStorage(updates)));
}

export function refreshMarketComments(dispatch, marketId, comments) {
  const fixedUp = fixupItemsForStorage(comments);
  // We are free to overwrite here because the required version is protecting quick add comments
  dispatch(overwriteMarketComments(marketId, fixedUp));
}
