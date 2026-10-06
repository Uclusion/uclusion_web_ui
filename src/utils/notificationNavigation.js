import _ from 'lodash';
import { ISSUE_TYPE, QUESTION_TYPE, REPLY_TYPE, REPORT_TYPE, SUGGEST_CHANGE_TYPE } from '../constants/comments';
import { getComment, getCommentRoot, isDesignCapsule } from '../contexts/CommentsContext/commentsContextHelper';
import { getMarket } from '../contexts/MarketsContext/marketsContextHelper';
import { addWorkspaceGroupAttribute } from '../pages/Home/YourWork/InboxContext';
import { formCommentLink, formInboxItemLink } from './marketIdPathFunctions';

const commentNotifications = ['ISSUE', 'UNREAD_COMMENT', 'UNREAD_REPLY', 'REPLY_MENTION',
  'UNREAD_RESOLVED', 'UNREAD_VOTE', 'NOT_FULLY_VOTED', 'UNREAD_JOB_APPROVAL_REQUEST', 'UNREAD_OPTION',
  'UNREAD_REVIEWABLE', 'UNASSIGNED', 'REVIEW_REQUIRED'];

export function isDirectCommentNotification(message, comment) {
  return !(message.type === 'UNREAD_VOTE' && message.link_type === 'INVESTIBLE_VOTE') &&
    commentNotifications.includes(message.type) &&
    (['UNREAD_REPLY', 'REPLY_MENTION', 'UNREAD_OPTION'].includes(message.type) ||
      [QUESTION_TYPE, SUGGEST_CHANGE_TYPE, REPORT_TYPE, REPLY_TYPE].includes(comment?.comment_type));
}

// The comment a notification is about; an option's notification is about its question.
function getNotificationComment(message, marketsState) {
  let marketId = message.comment_market_id || message.market_id;
  let commentId = message.comment_id;
  const market = getMarket(marketsState, marketId);
  if (message.type === 'UNREAD_OPTION' && market?.parent_comment_id) {
    marketId = market.parent_comment_market_id;
    commentId = market.parent_comment_id;
  }
  return { market, marketId, commentId };
}

// Keep notification identity separate from the page/anchor that displays its object.
export function getNotificationDestination(message, commentsState, marketsState) {
  const { marketId, commentId } = getNotificationComment(message, marketsState);
  const comment = getComment(commentsState, marketId, commentId);
  if (!isDirectCommentNotification(message, comment)) {
    return undefined;
  }
  return getNotificationObjectDestination(message, commentsState, marketsState);
}

export function getNotificationObjectDestination(message, commentsState, marketsState) {
  const { market, marketId, commentId } = getNotificationComment(message, marketsState);
  const root = getCommentRoot(commentsState, marketId, commentId);
  if (!root) {
    return undefined;
  }
  let url = formCommentLink(marketId, root.group_id, root.investible_id, commentId);
  if (market?.parent_comment_id && marketId === market.id) {
    const parent = getComment(commentsState, market.parent_comment_market_id, market.parent_comment_id);
    if (!parent) {
      return undefined;
    }
    const parentUrl = formCommentLink(market.parent_comment_market_id, parent.group_id,
      parent.investible_id, parent.id);
    url = `${parentUrl.split('#')[0]}#c${commentId}`;
  }
  if (message.type === 'UNREAD_OPTION' && message.decision_investible_id) {
    url = `${url.split('#')[0]}#option${message.decision_investible_id}`;
  }
  return {
    url,
    notification: { id: message.type_object_id, marketId, commentId: root.id }
  };
}

export function getDirectNotificationTitle(message, rootComment, isAssigned) {
  if (!isDirectCommentNotification(message, rootComment)) {
    return undefined;
  }
  if (message.type === 'REPLY_MENTION') return 'unreadMention';
  if (message.type === 'UNREAD_REPLY') return 'unreadReply';
  if (message.type === 'UNREAD_RESOLVED') return 'DecideResolveReopenTitle';
  if (message.type === 'UNREAD_VOTE') return 'DecideResolveTitle';
  if (isDesignCapsule(rootComment)) return 'ReviewDesignTitle';
  if (rootComment?.comment_type === REPORT_TYPE) {
    return !rootComment.investible_id && message.alert_type === 'AI_GENERATED'
      ? 'ReviewAINoteTitle' : 'DecideReviewTitle';
  }
  if (rootComment?.comment_type === SUGGEST_CHANGE_TYPE) {
    return ['NOT_FULLY_VOTED', 'UNREAD_JOB_APPROVAL_REQUEST'].includes(message.type) ? 'DecideVoteTitle' :
      (isAssigned ? 'DecideAcceptRejectTitle' : 'DecideIdeaTitle');
  }
  return 'DecideAnswerTitle';
}

/**
 * B-all-681: Next message keeps the inbox's order across jobs, but within one job its open questions,
 * suggestions and blockers come in the Unresponded order, oldest created first (B-all-601). Only the places
 * those notifications already hold are reordered, so everything else stays where it was.
 */
export function unrespondedOrderWithinJobs(orderedMessages, commentsState, marketsState) {
  const roots = orderedMessages.map((message) => {
    const { marketId, commentId } = getNotificationComment(message, marketsState);
    const root = getCommentRoot(commentsState, marketId, commentId);
    const isUnresponded = root?.investible_id && !root.resolved &&
      [QUESTION_TYPE, SUGGEST_CHANGE_TYPE, ISSUE_TYPE].includes(root.comment_type);
    return isUnresponded ? root : undefined;
  });
  const placesByJob = {};
  roots.forEach((root, index) => {
    if (root) {
      (placesByJob[root.investible_id] = placesByJob[root.investible_id] || []).push(index);
    }
  });
  const reordered = [...orderedMessages];
  Object.values(placesByJob).forEach((places) => {
    const oldestFirst = _.sortBy(places, [(index) => new Date(roots[index].created_at).getTime(),
      (index) => roots[index].id]);
    places.forEach((place, position) => {
      reordered[place] = orderedMessages[oldestFirst[position]];
    });
  });
  return reordered;
}

// The order Next message uses: group invites, then view, newest update first, then the
// within-job Unresponded reorder above.
export function orderLikeNextMessage(messages, groupsState, commentsState, marketsState) {
  const mapped = addWorkspaceGroupAttribute(messages || [], groupsState);
  return unrespondedOrderWithinJobs(_.orderBy(mapped, [
    (msg) => msg.type_object_id.includes('UNREAD_GROUP_'),
    'groupAttr',
    'updated_at',
  ], ['desc', 'asc', 'desc']), commentsState, marketsState);
}

// The notification in this set that Next message would open next. If you are already on one,
// that one is skipped while another remains.
export function pickNextMessageInSet(messages, groupsState, commentsState, marketsState,
  currentNotificationId, resource) {
  const list = messages || [];
  const eligible = list.filter((message) => {
    const messageUrl = getNotificationDestination(message, commentsState, marketsState)?.url
      || formInboxItemLink(message);
    return message.type_object_id !== currentNotificationId && messageUrl !== resource;
  });
  const pool = _.isEmpty(eligible) ? list : eligible;
  return orderLikeNextMessage(pool, groupsState, commentsState, marketsState)[0];
}
