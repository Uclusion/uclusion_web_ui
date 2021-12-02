import { getInvestibleName, refreshInvestibles } from '../contexts/InvestibesContext/investiblesContextHelper'
import { getFullStage } from '../contexts/MarketStagesContext/marketStagesContextHelper'
import { resolveInvestibleComments } from '../contexts/CommentsContext/commentsContextHelper'
import { findMessagesForInvestibleId } from './messageUtils'
import { addMessage, removeMessage } from '../contexts/NotificationsContext/notificationsContextReducer'
import { formInvestibleLink, formMarketLink } from './marketIdPathFunctions'
import { NOT_FULLY_VOTED_TYPE, REPORT_REQUIRED } from '../constants/notifications'

export function onInvestibleStageChange(targetStageId, newInv, investibleId, marketId, commentsState, commentsDispatch,
  invDispatch, diffDispatch, marketStagesState, messagesState, messagesDispatch, removeTypes) {
  refreshInvestibles(invDispatch, diffDispatch, [newInv]);
  const targetStage = getFullStage(marketStagesState, marketId, targetStageId) || {};
  if (targetStageId && marketStagesState && commentsState) {
    if (targetStage.close_comments_on_entrance) {
      resolveInvestibleComments(investibleId, marketId, commentsState, commentsDispatch);
    }
  }
  const messages = findMessagesForInvestibleId(investibleId, messagesState) || [];
  let useRemoveTypes = removeTypes;
  if (!useRemoveTypes && targetStage.move_on_comment) {
    useRemoveTypes = [NOT_FULLY_VOTED_TYPE, REPORT_REQUIRED];
  }
  messages.forEach((message) => {
    if (useRemoveTypes) {
      if (useRemoveTypes.includes(message.type)) {
        messagesDispatch(removeMessage(message));
      }
    } else {
      messagesDispatch(removeMessage(message));
    }
  });
}

export function notify(userId, investibleId, notificationType, notificationLevel, investiblesState, market,
  messagesDispatch) {
  const investibleLink = formInvestibleLink(market.id, investibleId);
  const investibleName = getInvestibleName(investibleId, investiblesState);
  const marketLink = formMarketLink(market.id);
  messagesDispatch(addMessage({ market_id_user_id: `${market.id}_${userId}`,
    type_object_id: `${notificationType}_${investibleId}`, type: notificationType, market_id: market.id,
    investible_id: investibleId, user_id: userId, level: notificationLevel, link: investibleLink,
    market_type: market.market_type, link_type: 'INVESTIBLE',
    market_link: marketLink, market_name: market['name'], link_multiple: marketLink, investible_name: investibleName,
    investible_link: investibleLink }));
}