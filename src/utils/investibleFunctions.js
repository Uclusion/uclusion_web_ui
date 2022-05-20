import { getInvestibleName, refreshInvestibles } from '../contexts/InvestibesContext/investiblesContextHelper'
import { getFullStage } from '../contexts/MarketStagesContext/marketStagesContextHelper'
import {
  reopenAutoclosedInvestibleComments,
  resolveInvestibleComments
} from '../contexts/CommentsContext/commentsContextHelper'
import { addMessage } from '../contexts/NotificationsContext/notificationsContextReducer'
import { formInvestibleLink, formMarketLink } from './marketIdPathFunctions'
import { NOT_FULLY_VOTED_TYPE, REPORT_REQUIRED } from '../constants/notifications'
import { pushMessage } from './MessageBusUtils'
import {
  MODIFY_NOTIFICATIONS_CHANNEL, STAGE_CHANGE_EVENT
} from '../contexts/NotificationsContext/notificationsContextMessages'

export function onInvestibleStageChange(targetStageId, newInv, investibleId, marketId, commentsState, commentsDispatch,
  invDispatch, diffDispatch, marketStagesState, removeTypes, fullStage) {
  refreshInvestibles(invDispatch, diffDispatch, [newInv]);
  const targetStage = getFullStage(marketStagesState, marketId, targetStageId) || {};
  if (targetStageId && marketStagesState && commentsState) {
    if (targetStage.close_comments_on_entrance) {
      resolveInvestibleComments(investibleId, marketId, commentsState, commentsDispatch);
    }
  }
  if (fullStage.close_comments_on_entrance && commentsState && commentsDispatch) {
    reopenAutoclosedInvestibleComments(investibleId, marketId, commentsState, commentsDispatch);
  }
  let useRemoveTypes = removeTypes;
  if (!useRemoveTypes && targetStage.move_on_comment) {
    useRemoveTypes = [NOT_FULLY_VOTED_TYPE, REPORT_REQUIRED];
  }
  pushMessage(MODIFY_NOTIFICATIONS_CHANNEL, { event: STAGE_CHANGE_EVENT, investibleId, useRemoveTypes });
}

export function notify(userId, investibleId, notificationType, notificationLevel, investiblesState, market,
  messagesDispatch) {
  const investibleLink = formInvestibleLink(market.id, investibleId);
  const investibleName = getInvestibleName(investiblesState, investibleId);
  const marketLink = formMarketLink(market.id);
  messagesDispatch(addMessage({ market_id_user_id: `${market.id}_${userId}`,
    type_object_id: `${notificationType}_${investibleId}`, type: notificationType, market_id: market.id,
    investible_id: investibleId, user_id: userId, level: notificationLevel, link: investibleLink,
    market_type: market.market_type, link_type: 'INVESTIBLE', link_multiple: marketLink,
    investible_name: investibleName, investible_link: investibleLink }));
}