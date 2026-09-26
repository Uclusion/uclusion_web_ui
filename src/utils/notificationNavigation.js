import { QUESTION_TYPE, REPLY_TYPE, REPORT_TYPE, SUGGEST_CHANGE_TYPE } from '../constants/comments';
import { getComment, getCommentRoot, isDesignCapsule } from '../contexts/CommentsContext/commentsContextHelper';
import { getMarket } from '../contexts/MarketsContext/marketsContextHelper';
import { formCommentLink } from './marketIdPathFunctions';

const commentNotifications = ['ISSUE', 'UNREAD_COMMENT', 'UNREAD_REPLY', 'REPLY_MENTION',
  'UNREAD_RESOLVED', 'UNREAD_VOTE', 'NOT_FULLY_VOTED', 'UNREAD_JOB_APPROVAL_REQUEST', 'UNREAD_OPTION',
  'UNREAD_REVIEWABLE', 'UNASSIGNED', 'REVIEW_REQUIRED'];

export function isDirectCommentNotification(message, comment) {
  return !(message.type === 'UNREAD_VOTE' && message.link_type === 'INVESTIBLE_VOTE') &&
    commentNotifications.includes(message.type) &&
    (['UNREAD_REPLY', 'REPLY_MENTION', 'UNREAD_OPTION'].includes(message.type) ||
      [QUESTION_TYPE, SUGGEST_CHANGE_TYPE, REPORT_TYPE, REPLY_TYPE].includes(comment?.comment_type));
}

// Keep notification identity separate from the page/anchor that displays its object.
export function getNotificationDestination(message, commentsState, marketsState) {
  let marketId = message.comment_market_id || message.market_id;
  let commentId = message.comment_id;
  const market = getMarket(marketsState, marketId);
  if (message.type === 'UNREAD_OPTION' && market?.parent_comment_id) {
    marketId = market.parent_comment_market_id;
    commentId = market.parent_comment_id;
  }
  const comment = getComment(commentsState, marketId, commentId);
  const root = getCommentRoot(commentsState, marketId, commentId);
  if (!root || !isDirectCommentNotification(message, comment)) {
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
