import { removeMessage } from '../contexts/NotificationsContext/notificationsContextReducer'
import { DECISION_TYPE, INITIATIVE_TYPE } from '../constants/markets'
import { removeWorkListItem } from '../pages/Home/YourWork/WorkListItem'

export function messageText(message, intl) {
  const { link_type: linkType, market_type: marketType } = message;
  switch(message.type) {
    case 'ASSIGNED_UNREVIEWABLE':
      return intl.formatMessage({ id: 'unfinished' });
    case 'UNASSIGNED':
      if (linkType === 'MARKET_TODO') {
        return intl.formatMessage({ id: 'assignTodo' });
      }
      return intl.formatMessage({ id: 'assignTask' });
    case 'UNREAD_LABEL':
      return intl.formatMessage({ id: 'unreadLabel' });
    case 'UNREAD_ATTACHMENT':
      return intl.formatMessage({ id: 'unreadAttachment' });
    case 'UNREAD_NAME':
      return intl.formatMessage({ id: 'unreadName' });
    case 'UNREAD_DESCRIPTION':
      return intl.formatMessage({ id: 'unreadDescription' });
    case 'UNREAD_ESTIMATE':
      return intl.formatMessage({ id: 'unreadEstimate' });
    case 'UNREAD_ASSIGNMENT':
      return intl.formatMessage({ id: 'unreadAssignment' });
    case 'UNREAD_OPTION':
      return intl.formatMessage({ id: 'unreadOption' });
    case 'ISSUE':
      return intl.formatMessage({ id: 'issue' });
    case 'INVESTIBLE_SUBMITTED':
      return intl.formatMessage({ id: 'unPromotedOption' });
    case 'UNREAD_COLLABORATION':
      if (marketType === DECISION_TYPE) {
        return intl.formatMessage({ id: 'dialogClosing' });
      }
      return intl.formatMessage({ id: 'initiativeClosing' });
    case 'UNREAD_CLOSED':
      return intl.formatMessage({ id: 'workspaceClosed' });
    case 'NOT_FULLY_VOTED':
      if (marketType === DECISION_TYPE) {
        return intl.formatMessage({ id: 'pleaseChoose' });
      }
      if (marketType === INITIATIVE_TYPE) {
        return intl.formatMessage({ id: 'pleaseVote' });
      }
      return intl.formatMessage({ id: 'pleaseApprove' });
    case 'NEW_TODO':
      return intl.formatMessage({ id: 'resolveTodo' });
    case 'ISSUE_RESOLVED':
      return intl.formatMessage({ id: 'changeStage' });
    case 'REMOVED':
      return intl.formatMessage({ id: 'removed' });
    case 'UNREMOVED':
      return intl.formatMessage({ id: 'unRemoved' });
    case 'UNREAD_REVIEWABLE':
    case 'REVIEW_REQUIRED':
      return intl.formatMessage({ id: 'pleaseReview' });
    case 'REPORT_REQUIRED':
      return intl.formatMessage({ id: 'updateStatus' });
    case 'UNREAD_REPORT':
      return intl.formatMessage({ id: 'missingProgress' });
    case 'DRAFT':
      return intl.formatMessage({ id: 'addCollaborators' });
    case 'USER_POKED':
      return intl.formatMessage({ id: 'pleaseUpgrade' });
    case 'UNREAD_REPLY':
      return intl.formatMessage({ id: 'unreadReply' });
    case 'UNREAD_RESOLVED':
      return intl.formatMessage({ id: 'unreadResolved' });
    case 'UNREAD_COMMENT':
      return intl.formatMessage({ id: 'unreadComment' });
    case 'UNREAD_VOTE':
      if (marketType === INITIATIVE_TYPE) {
        return intl.formatMessage({ id: 'unreadVote' });
      }
      return intl.formatMessage({ id: 'unreadApproval' });
    default:
      return message.text;
  }
}

export function findMessagesForCommentId(commentId, state) {
  const { messages } = (state || {});
  const safeMessages = messages || [];
  return safeMessages.filter((message) => message.comment_id === commentId);
}

export function removeMessagesForCommentId(commentId, state, dispatch, removeClass) {
  const messages = findMessagesForCommentId(commentId, state) || [];
  messages.forEach((message) => {
    removeWorkListItem(message, removeClass, dispatch);
  });
}

export function removeMessagesForMarket(marketId, state, dispatch) {
  const messages = findMessagesForMarketId(marketId, state) || [];
  messages.forEach((message) => {
    dispatch(removeMessage(message));
  });
}

export function findMessagesForMarketId(marketId, state) {
  const { messages } = (state || {});
  const safeMessages = messages || [];
  return safeMessages.filter((message) => message.market_id === marketId);
}

export function findMessagesForInvestibleId(investibleId, state) {
  const { messages } = (state || {});
  const safeMessages = messages || [];
  return safeMessages.filter((message) => message.investible_id === investibleId);
}

export function findMessageForCommentId(commentId, state) {
  const { messages } = (state || {});
  const safeMessages = messages || [];
  return safeMessages.find((message) => message.comment_id === commentId);
}

export function findMessageOfType(aType, notificationId, state, subtype) {
  const { messages } = (state || {});
  const safeMessages = messages || [];
  const typeObjectId = subtype ? `${aType}_${subtype}_${notificationId}` : `${aType}_${notificationId}`;
  return safeMessages.find((message) => message.type_object_id === typeObjectId);
}

export function findMessageOfTypeAndId(notificationId, state, subtype) {
  return findMessageOfType('UNREAD', notificationId, state, subtype);
}