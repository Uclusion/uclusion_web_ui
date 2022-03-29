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
  const marketComments = state[marketId] || [];
  return marketComments.find(comment => comment.id === commentId);
}

export function getCommentRoot(state, marketId, commentId) {
  const comment = getComment(state, marketId, commentId);
  if (_.isEmpty(comment)) {
    return undefined;
  }
  if (comment.deleted) {
    return undefined;
  }
  //we're the root, return us
  if (_.isEmpty(comment.reply_id)) {
    return comment;
  }
  // we're an internal node, go up the tree
  return getCommentRoot(state, marketId, comment.reply_id);
}

export function getDraftComments(state, marketId, investibleId) {
  const marketComments = state[marketId] || [];
  if (investibleId) {
    return marketComments.filter((comment) => !comment.deleted && comment.investible_id === investibleId &&
      comment.is_sent === false);
  }
  return marketComments.filter((comment) => !comment.deleted && comment.is_sent === false);
}

export function getMarketComments(state, marketId) {
  const marketComments = state[marketId] || [];
  return marketComments.filter((comment) => !comment.deleted && comment.is_sent !== false);
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

export function getInvestibleComments(investibleId, marketId, state) {
  const comments = getMarketComments(state, marketId);
  return comments.filter(comment => comment.investible_id === investibleId) || [];
}

export function getUnresolvedInvestibleComments(investibleId, marketId, state) {
  const comments = getMarketComments(state, marketId);
  return comments.filter(comment => comment.investible_id === investibleId && !comment.resolved) || [];
}

export function reopenAutoclosedInvestibleComments(investibleId, marketId, state, dispatch) {
  const comments = getInvestibleComments(investibleId, marketId, state);
  const commentsFiltered = comments.filter((comment) => comment.resolved && !comment.deleted && comment.auto_closed);
  const reopenedComments = commentsFiltered.map((comment) => {
    return { ...comment, resolved: false, auto_closed: false };
  });
  refreshMarketComments(dispatch, marketId, reopenedComments);
}

export function resolveInvestibleComments(investibleId, marketId, state, dispatch) {
  const unresolvedComments = getUnresolvedInvestibleComments(investibleId, marketId, state);
  const resolvedComments = unresolvedComments.map((comment) => {
    return { ...comment, resolved: true };
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
