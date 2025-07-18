import { DECISION_TYPE, INITIATIVE_TYPE } from '../constants/markets'
import { removeWorkListItem } from '../pages/Home/YourWork/WorkListItem'
import _ from 'lodash'
import { REPORT_TYPE } from '../constants/comments'
import { quickRemoveMessages, removeMessages } from '../contexts/NotificationsContext/notificationsContextReducer';
import { getMarketInvestibles } from '../contexts/InvestibesContext/investiblesContextHelper';
import { getMarketComments } from '../contexts/CommentsContext/commentsContextHelper';
import { NOT_FULLY_VOTED_TYPE, UNREAD_JOB_APPROVAL_REQUEST } from '../constants/notifications';
import { getMessageId } from '../contexts/NotificationsContext/notificationsContextHelper';

function getMessageTextForId(rawId, isMobile, intl) {
  const id = isMobile ? `${rawId}Mobile` : rawId;
  return intl.formatMessage({ id });
}

export function getShowTerminate(message) {
  return message.type_object_id.startsWith('UNREAD');
}

export function getLabelForTerminate(message) {
  return message.type_object_id.startsWith('UNREAD') ? 'notificationDelete' : 'DecideWizardMute';
}

export function removeInlineMarketMessages(inlineMarketId, investiblesState, commentsState, messagesState,
  messagesDispatch) {
  const inlineInvestibles = getMarketInvestibles(investiblesState, inlineMarketId) || [];
  const anInlineMarketInvestibleComments = getMarketComments(commentsState, inlineMarketId) || [];
  inlineInvestibles.forEach((inv) => {
    const messages = findMessagesForInvestibleId(inv.investible.id, messagesState) || [];
    const messageIds = messages.map((message) => message.type_object_id);
    messagesDispatch(removeMessages(messageIds));
  });
  anInlineMarketInvestibleComments.forEach((comment) => {
    const messages = findMessagesForCommentId(comment.id, messagesState) || [];
    const messageIds = messages.map((message) => message.type_object_id);
    messagesDispatch(removeMessages(messageIds));
  });
}

export function titleText(message, isMobile, intl, comment, userId, isInVotingStage, assigned) {
  switch(message.type) {
    case 'REPORT_REQUIRED':
      return getMessageTextForId('reportRequired', isMobile, intl);
    case 'ISSUE':
      if (message.market_type !== DECISION_TYPE) {
        return messageText(message, isMobile, intl);
      }
      return intl.formatMessage({ id: 'feedback' });
    case 'UNREAD_COMMENT':
      const { comment_type: commentType } = comment || {};
      if (commentType !== REPORT_TYPE) {
        return messageText(message, isMobile, intl);
      }
      return intl.formatMessage({ id: 'feedback' });
    case 'NEW_TODO':
      return intl.formatMessage({ id: 'feedback' });
    default:
      const { created_by: createdBy } = comment || {};
      if (createdBy === userId && !['UNREAD_REPLY', 'UNREAD_RESOLVED', 'UNASSIGNED'].includes(message.type)) {
        // This notification is about moderating a comment I created
        return intl.formatMessage({ id: 'decisionDialogDiscussionLabel' });
      }
      if (!comment && isInVotingStage && (assigned || []).includes(userId)) {
        // This notification is for something assigned to me in approval
        return intl.formatMessage({ id: 'inboxVotingLabel' });
      }
      return messageText(message, isMobile, intl);
  }
}

export function messageText(message, isMobile, intl) {
  const { link_type: linkType, market_type: marketType } = message;
  switch(message.type) {
    case 'UNASSIGNED':
      if (linkType === 'MARKET_TODO') {
        return getMessageTextForId('assignTodo', isMobile, intl);
      }
      return getMessageTextForId('assignTask', isMobile, intl);
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
      if (linkType.includes('QUESTION')) {
        return getMessageTextForId('pleaseChoose', isMobile, intl);
      }
      if (linkType.includes('SUGGESTION')) {
        return getMessageTextForId('pleaseVote', isMobile, intl);
      }
      return getMessageTextForId('issue', isMobile, intl);
    case 'INVESTIBLE_SUBMITTED':
      return getMessageTextForId('unPromotedOption', isMobile, intl);
    case 'UNREAD_CLOSED':
      return getMessageTextForId('workspaceClosed', isMobile, intl);
    case 'FULLY_VOTED':
      return getMessageTextForId('fullyVoted', isMobile, intl);
    case UNREAD_JOB_APPROVAL_REQUEST:
    case NOT_FULLY_VOTED_TYPE:
      if (marketType === DECISION_TYPE) {
        return getMessageTextForId('pleaseChoose', isMobile, intl);
      }
      if (marketType === INITIATIVE_TYPE) {
        return getMessageTextForId('pleaseVote', isMobile, intl);
      }
      return getMessageTextForId('pleaseApprove', isMobile, intl);
    case 'NEW_TODO':
      return getMessageTextForId('resolveTodo', isMobile, intl);
    case 'REMOVED':
      return getMessageTextForId('removed', isMobile, intl);
    case 'UNREMOVED':
      return getMessageTextForId('unRemoved', isMobile, intl);
    case 'UNREAD_REVIEWABLE':
      if (linkType === 'MARKET_TODO') {
        return getMessageTextForId('assignTodo', isMobile, intl);
      }
      if (linkType === 'INVESTIBLE_COMMENT') {
        return getMessageTextForId('resolveTodo', isMobile, intl);
      }
      return getMessageTextForId('pleaseAssign', isMobile, intl);
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
      return message.name;
  }
}

export function findMessagesForGroupId(groupId, state, isHighlighted) {
  const { messages } = (state || {});
  const safeMessages = messages || [];
  return safeMessages.filter((message) => message.group_id === groupId && (isHighlighted === undefined || message.is_highlighted === isHighlighted));
}


export function findMessagesForCommentId(commentId, state) {
  const { messages } = (state || {});
  const safeMessages = messages || [];
  return safeMessages.filter((message) => message.comment_id === commentId && !message.deleted);
}

export function findMessagesForTypeObjectId(typeObjectId, state) {
  if (!typeObjectId) {
    return undefined;
  }
  const { messages } = (state || {});
  const safeMessages = messages || [];
  return safeMessages.find((message) => message.type_object_id === typeObjectId && !message.deleted);
}

export function findMessagesForUserPoked(state) {
  const { messages } = (state || {});
  const safeMessages = messages || [];
  return safeMessages.filter((message) => message.type === 'USER_POKED' && !message.deleted);
}

export function removeMessagesForCommentId(commentId, state, messagesDispatch) {
  const messages = findMessagesForCommentId(commentId, state) || [];
  messages.forEach((message) => {
    if (messagesDispatch) {
      const { type_object_id: typeObjectId } = message;
      messagesDispatch(quickRemoveMessages([typeObjectId]));
    } else {
      removeWorkListItem(message);
    }
  });
}

export function findMessagesForInvestibleIds(investibleIds, state, isHighlighted) {
  const { messages } = (state || {});
  const safeInvestibleIds = investibleIds || [];
  const safeMessages = messages || [];
  return safeMessages.filter((message) => (safeInvestibleIds.includes(message.investible_id) ||
    safeInvestibleIds.includes(message.decision_investible_id)) && !message.deleted &&
    (isHighlighted === undefined || message.is_highlighted === isHighlighted));
}

export function findMessagesForInvestibleId(investibleId, state) {
  const { messages } = (state || {});
  const safeMessages = messages || [];
  return safeMessages.filter((message) => (message.investible_id === investibleId ||
    message.decision_investible_id === investibleId) && !message.deleted);
}

export function findMessagesForCommentIds(commentIds, state, isHighlighted) {
  const { messages } = (state || {});
  const safeCommentIds = commentIds || [];
  const safeMessages = messages || [];
  return safeMessages.filter((message) => (safeCommentIds.includes(message.comment_id)
    || !_.isEmpty(_.intersection(safeCommentIds, message.comment_list))) && !message.deleted &&
    (isHighlighted === undefined || message.is_highlighted === isHighlighted));
}

export function findMessageForCommentId(commentId, state) {
  const { messages } = (state || {});
  const safeMessages = messages || [];
  return safeMessages.find((message) => (message.comment_id === commentId
    || message.comment_list?.includes(commentId)) && !message.deleted);
}

export function findMessageOfType(aType, notificationId, state, subtype) {
  const { messages } = (state || {});
  const safeMessages = messages || [];
  const typeObjectId = subtype ? `${aType}_${subtype}_${notificationId}` : `${aType}_${notificationId}`;
  return safeMessages.find((message) => message.type_object_id === typeObjectId && !message.deleted);
}

export function findMessageByInvestmentUserId(investmentUserId, investibleId, state) {
  const { messages } = (state || {});
  const safeMessages = messages || [];
  return safeMessages.find((message) => !_.isEmpty(message.voted_list?.find((item) => item.investible_id === investibleId && item.id === investmentUserId)) 
  && !message.deleted);
}

export function findMessageOfTypeAndId(notificationId, state, subtype) {
  return findMessageOfType('UNREAD', notificationId, state, subtype);
}

export function getPaginatedItems(items, page=1, pageSize, workItemId) {
  const offset = (page - 1) * pageSize;
  const workItem = workItemId && items ? items.filter((item) => item.id === workItemId
    || item.type_object_id === workItemId) : undefined;
  const hasWorkItem = !_.isEmpty(workItem);
  const data = hasWorkItem ? workItem : _.drop(items, offset).slice(0, pageSize);
  const last = _.size(data) > 0 ? offset + _.size(data) : 1;
  const itemIndex = _.findIndex(items,
    (item) => item.id === workItemId || getMessageId(item) === workItemId);
  let previousItemId = undefined;
  let nextItemId = undefined;
  if (itemIndex >= 0) {
    if (itemIndex < items.length - 1) {
      const nextItem = items[itemIndex + 1];
      nextItemId = nextItem.id || nextItem.type_object_id;
    }
    if (itemIndex > 0) {
      const previousItem = items[itemIndex - 1];
      previousItemId = previousItem.id || previousItem.type_object_id;
    }
  }
  const hasMore = hasWorkItem ? !_.isEmpty(nextItemId) : last < _.size(items);
  const hasLess = hasWorkItem ? !_.isEmpty(previousItemId) : page > 1;
  return { first: offset + 1, last, data, hasMore, hasLess, previousItemId, nextItemId, current: (itemIndex + 1) };
}

export function getRealPage(tabComments, pinned, originalPage, pageSize) {
  if (!pinned) {
    return originalPage;
  }
  const index = _.findIndex(tabComments, (item) => item.id === pinned);
  if (index < 0) {
    return originalPage;
  }
  return Math.floor(index / pageSize) + 1;
}

export function getUnreadCount(comments, messagesState) {
  let unreadCount = 0;
  (comments || []).forEach((comment) => {
    const myMessage = findMessageForCommentId(comment.id, messagesState);
    if (myMessage?.is_highlighted){
      unreadCount++;
    }
  });
  return unreadCount;
}