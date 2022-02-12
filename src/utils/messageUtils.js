import { removeMessage } from '../contexts/NotificationsContext/notificationsContextReducer'
import { DECISION_TYPE, INITIATIVE_TYPE } from '../constants/markets'
import { removeWorkListItem } from '../pages/Home/YourWork/WorkListItem'

function getMessageTextForId(rawId, isMobile, intl) {
  const id = isMobile ? `${rawId}Mobile` : rawId;
  return intl.formatMessage({ id });
}

export function messageText(message, isMobile, intl) {
  const { link_type: linkType, market_type: marketType } = message;
  switch(message.type) {
    case 'ASSIGNED_UNREVIEWABLE':
      return getMessageTextForId('unfinished', isMobile, intl);
    case 'UNASSIGNED':
      if (linkType === 'MARKET_TODO') {
        return getMessageTextForId('assignTodo', isMobile, intl);
      }
      return getMessageTextForId('assignTask', isMobile, intl);
    case 'UNREAD_LABEL':
      return getMessageTextForId('unreadLabel', isMobile, intl);
    case 'UNREAD_ATTACHMENT':
      return getMessageTextForId('unreadAttachment', isMobile, intl);
    case 'UNREAD_NAME':
      return getMessageTextForId('unreadName', isMobile, intl);
    case 'UNREAD_DESCRIPTION':
      return getMessageTextForId('unreadDescription', isMobile, intl);
    case 'UNREAD_ESTIMATE':
      return getMessageTextForId('unreadEstimate', isMobile, intl);
    case 'UNACCEPTED_ASSIGNMENT':
      return getMessageTextForId('unreadAssignment', isMobile, intl);
    case 'UNREAD_OPTION':
      return getMessageTextForId('unreadOption', isMobile, intl);
    case 'ISSUE':
      return getMessageTextForId('issue', isMobile, intl);
    case 'INVESTIBLE_SUBMITTED':
      return getMessageTextForId('unPromotedOption', isMobile, intl);
    case 'UNREAD_CLOSED':
      return getMessageTextForId('workspaceClosed', isMobile, intl);
    case 'FULLY_VOTED':
      return getMessageTextForId('fullyVoted', isMobile, intl);
    case 'NOT_FULLY_VOTED':
      if (marketType === DECISION_TYPE) {
        return getMessageTextForId('pleaseChoose', isMobile, intl);
      }
      if (marketType === INITIATIVE_TYPE) {
        return getMessageTextForId('pleaseVote', isMobile, intl);
      }
      return getMessageTextForId('pleaseApprove', isMobile, intl);
    case 'NEW_TODO':
      return getMessageTextForId('resolveTodo', isMobile, intl);
    case 'ISSUE_RESOLVED':
      return getMessageTextForId('changeStage', isMobile, intl);
    case 'REMOVED':
      return getMessageTextForId('removed', isMobile, intl);
    case 'UNREMOVED':
      return getMessageTextForId('unRemoved', isMobile, intl);
    case 'UNREAD_REVIEWABLE':
    case 'REVIEW_REQUIRED':
      return getMessageTextForId('pleaseReview', isMobile, intl);
    case 'REPORT_REQUIRED':
      return getMessageTextForId('updateStatus', isMobile, intl);
    case 'UNREAD_DRAFT':
      return getMessageTextForId('addCollaborators', isMobile, intl);
    case 'USER_POKED':
      return getMessageTextForId('pleaseUpgrade', isMobile, intl);
    case 'UNREAD_REPLY':
      return getMessageTextForId('unreadReply', isMobile, intl);
    case 'UNREAD_RESOLVED':
      return getMessageTextForId('unreadResolved', isMobile, intl);
    case 'UNREAD_COMMENT':
      return getMessageTextForId('unreadComment', isMobile, intl);
    case 'UNREAD_VOTE':
      if (marketType === INITIATIVE_TYPE) {
        return getMessageTextForId('unreadVote', isMobile, intl);
      }
      return getMessageTextForId('unreadApproval', isMobile, intl);
    default:
      return message.text;
  }
}

export function getLabelList(messagesFull, intl, isMobile) {
  const labels = [];
  messagesFull.forEach((message) => {
    const label = messageText(message, isMobile, intl).toLowerCase();
    if (!labels.includes(label)) {
      labels.push(label);
    }
  });
  return labels.join(', ');
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