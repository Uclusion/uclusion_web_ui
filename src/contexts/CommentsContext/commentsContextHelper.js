import _ from 'lodash';
import { updateComments } from './commentsContextReducer';
import { pushMessage } from '../../utils/MessageBusUtils';
import {
  INDEX_COMMENT_TYPE,
  INDEX_UPDATE,
  SEARCH_INDEX_CHANNEL
} from '../SearchIndexContext/searchIndexContextMessages';
import { TICKET_INDEX_CHANNEL } from '../TicketContext/ticketIndexContextMessages';

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

function filterToComment(comments, commentId) {
  return comments.find(comment => comment.id === commentId);
}

export function filterToRoot(comments, commentId) {
  const comment = filterToComment(comments, commentId);
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
  return filterToRoot(comments, comment.reply_id);
}

export function getMarketComments(state, marketId, groupId) {
  const marketComments = state[marketId] || [];
  return marketComments.filter((comment) => !comment.deleted && comment.is_sent !== false &&
    (groupId === undefined || comment.group_id === groupId));
}

export function getThreadAboveIds(commentId, marketComments) {
  const threadIds = [commentId];
  const comment = marketComments.find((aComment) => aComment.id === commentId);
  if (!comment.reply_id) {
    return threadIds;
  }
  return threadIds.concat(getThreadAboveIds(comment.reply_id, marketComments));
}

export function getCommentThreads(roots, marketComments) {
  let allThreads = [];
  (roots || []).forEach((root) => {
    allThreads = allThreads.concat((marketComments || []).filter((comment) => comment.root_comment_id === root.id
      || comment.id === root.id));
  });
  return allThreads;
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
  addMarketComments(dispatch, marketId, reopenedComments);
}

export function resolveInvestibleComments(investibleId, marketId, state, dispatch) {
  const unresolvedComments = getUnresolvedInvestibleComments(investibleId, marketId, state);
  const resolvedComments = unresolvedComments.map((comment) => {
    return { ...comment, resolved: true };
  });
  addMarketComments(dispatch, marketId, resolvedComments);
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
  const ticketCodeItems = [];
  const { id: commentId, group_id: groupId, ticket_code: ticketCode, investible_id: investibleId } = comment;
  if (ticketCode) {
    ticketCodeItems.push({ ticketCode, marketId, commentId, groupId, investibleId });
  }
  if (!_.isEmpty(ticketCodeItems)) {
    pushMessage(TICKET_INDEX_CHANNEL, ticketCodeItems);
  }
  addMarketComments(dispatch, marketId, updates);
}

export function addMarketComments(dispatch, marketId, comments) {
  dispatch(updateComments(marketId, comments));
}
