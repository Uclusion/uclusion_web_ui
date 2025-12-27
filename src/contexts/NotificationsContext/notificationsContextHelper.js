import _ from 'lodash'
import { getMarket } from '../MarketsContext/marketsContextHelper'
import { getMarketPresences } from '../MarketPresencesContext/marketPresencesHelper'
import { getInvestible } from '../InvestibesContext/investiblesContextHelper'
import { getMarketInfo } from '../../utils/userFunctions'
import { getComment, getCommentRoot } from '../CommentsContext/commentsContextHelper';
import { getGroup } from '../MarketGroupsContext/marketGroupsContextHelper';
import { UNASSIGNED_TYPE } from '../../constants/notifications';
import { dehighlightMessages } from './notificationsContextReducer';
import { addWorkspaceGroupAttribute } from '../../pages/Home/YourWork/InboxContext';
import { getMarketClient } from '../../api/marketLogin'

function checkComment(commentId, commentVersion, marketId, commentsState, childId) {
  if (!commentId) {
    return true;
  }
  const commentRoot = getCommentRoot(commentsState, marketId, commentId);
  if (!commentRoot) {
    console.warn(`Comment root missing for ${commentId} and ${marketId}`);
    return false;
  }
  const comment = getComment(commentsState, marketId, commentId);
  if (childId && !comment?.children?.includes(childId)) {
    console.warn(`Child missing for ${commentId} and ${childId}`);
    return false;
  }
  if (!commentVersion) {
    if (_.isEmpty(comment)) {
      console.warn(`Comment missing for ${commentId}`);
    }
    return !_.isEmpty(comment);
  }
  if (comment.version < commentVersion) {
    console.warn(`Comment version mismatch ${comment.version} and ${commentVersion}`);
  }
  // Can't enforce strict equality cause some other operation can occur on the question than resolved
  return comment.version >= commentVersion;
}

export function dehighlightMessage(message, messagesDispatch, isPromise=false) {
  if (message.type !== UNASSIGNED_TYPE) {
    // Handle unassigned on the triage page after render or else default open row breaks
    const typeObjectIds = [message.type_object_id];
    if (isPromise) {
      return getMarketClient(message.market_id).then((client) =>
        client?.users.dehighlightNotifications(typeObjectIds)).then(() => messagesDispatch(dehighlightMessages(typeObjectIds, true)));
    }
    messagesDispatch(dehighlightMessages(typeObjectIds, false));
  }
}

export function messageIsSynced(message, marketState, marketPresencesState, commentsState, investiblesState,
  groupState) {
  const { market_id: marketId, market_version: marketVersion, investible_id: investibleId,
    investible_version: investibleVersion, comment_id: commentId, comment_version: commentVersion,
    parent_comment_id: parentCommentId, type: messageType, type_object_id: typeObjectId,
    investment_user_id: investmentUserId, comment_market_id: commentMarketId, market_investible_id: marketInvestibleId,
    market_investible_version: marketInvestibleVersion, decision_investible_id: decisionInvestibleId,
    voted_list: votedList, comment_list: commentList } = message;
  const useMarketId = commentMarketId || marketId;
  const voters = votedList?.map((item) => item.id);
  let checked = commentVersion;
  if (!_.isEmpty(commentList)) {
    const notFoundComment = commentList.find((item) =>
      !checkComment(item.id, undefined, useMarketId, commentsState));
    return _.isEmpty(notFoundComment);
  } else if (!checkComment(commentId, commentVersion, useMarketId, commentsState)) {
    return false;
  }
  if (parentCommentId && !checkComment(parentCommentId, undefined, useMarketId, commentsState,
    commentId)) {
    return false;
  }
  if (marketVersion) {
    checked = true;
    const market = getMarket(marketState, marketId) || {};
    if (market.version < marketVersion) {
      console.warn(`Market version mismatch for ${marketVersion} and ${marketId}`);
      return false;
    }
  }
  if (investibleVersion) {
    checked = true;
    const inv = getInvestible(investiblesState, investibleId) || {};
    const { investible } = inv;
    if (!investible || investible.version < investibleVersion) {
      if (!investible) {
        console.warn(`Investible missing for version ${investibleVersion} and ${investibleId}`);
      } else {
        console.warn(`Mismatch for ${investibleVersion} on ${investibleId} with version ${investible.version}`);
      }
      return false;
    }
  }
  if (decisionInvestibleId || investibleId || marketInvestibleId) {
    checked = true;
    let inv;
    if (decisionInvestibleId || investibleId) {
      inv = getInvestible(investiblesState, decisionInvestibleId || investibleId) || {};
    } else {
      const values = Object.values(investiblesState);
      inv = values.find((inv) => {
        const marketInfo = getMarketInfo(inv, marketId);
        return marketInfo?.id === marketInvestibleId;
      });
    }
    let marketInfo = getMarketInfo(inv, marketId);
    if (_.isEmpty(marketInfo)) {
      marketInfo = getMarketInfo(inv, commentMarketId);
    }
    if (_.isEmpty(marketInfo) || marketInfo.version < marketInvestibleVersion) {
      const idForLogging = decisionInvestibleId || investibleId || marketInvestibleId;
      if (!_.isEmpty(marketInfo)) {
        console.warn(`Info ${marketInfo.version} less ${marketInvestibleVersion} for ${idForLogging}`);
      } else {
        console.warn(`Missing market info for ${idForLogging} in ${marketId}`);
      }
      console.warn(message);
      return false;
    }
  }
  if (investmentUserId || voters) {
    checked = true;
    const toCheckList = voters ? voters : [investmentUserId];
    const presences = getMarketPresences(marketPresencesState, marketId) || [];
    let allInvestorsFound = true;
    toCheckList.forEach((investor) => {
      const investmentPresence = presences.find((presence) => presence.id === investor) || {};
      const { investments } = investmentPresence;
      if (_.isEmpty(investments)) {
        console.warn(`Empty investments for ${investor} and ${marketId}`);
        allInvestorsFound = false;
      }
    });
    if (!allInvestorsFound) {
      return false;
    }
  }
  if (messageType === 'UNREAD_GROUP') {
    const [, ,groupId] = typeObjectId.split('_');
    const group = getGroup(groupState, marketId, groupId) || {};
    checked = !_.isEmpty(group);
  }
  if (!checked) {
    console.warn('Message is not checked for sync');
    console.warn(message);
  }
  return true;
}

export function isInInbox(message) {
  return !(!message.type || message.type === 'UNREAD_REPORT' || message.deleted);
}

export function getInboxTarget(message) {
  if (message && !message.type_object_id) {
    return 'outbox';
  }
  return '/inbox';
}

export function getMessageId(message) {
  if (message?.type_object_id?.includes(message?.user_id)) {
    return `${message?.market_id_user_id}_${message?.type_object_id}`;
  }
  // object_id will be unique except if it is the same as the user_id
  return message?.type_object_id || message?.id;
}

export function getInboxCount(messagesState, groupAttr, groupsState, isRawCount=false) {
  let calcPend = 0;
  if (!_.isEmpty(messagesState)) {
    const { messages } = messagesState;
    if (!_.isEmpty(messages)) {
      const fullGroupAttr = `${groupAttr}_${groupAttr}`;
      const messagesProcessed = groupsState ? addWorkspaceGroupAttribute(messages, groupsState) : messages;
      messagesProcessed.forEach((message) => {
        const { is_highlighted: isHighlighted } = message;
        if ((isHighlighted || isRawCount) && isInInbox(message) && (!groupAttr || !message.groupAttr
          || message.groupAttr === fullGroupAttr)) {
          calcPend += 1;
        }
      });
    }
  }
  return calcPend;
}
