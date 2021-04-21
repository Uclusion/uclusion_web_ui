import { refreshInvestibles } from '../contexts/InvestibesContext/investiblesContextHelper'
import { getFullStage } from '../contexts/MarketStagesContext/marketStagesContextHelper'
import { resolveInvestibleComments } from '../contexts/CommentsContext/commentsContextHelper'
import { findMessagesForInvestibleId } from './messageUtils'
import { removeMessage } from '../contexts/NotificationsContext/notificationsContextReducer'

export function onInvestibleStageChange(targetStageId, newInv, investibleId, marketId, commentsState, commentsDispatch,
  invDispatch, diffDispatch, marketStagesState, messagesState, messagesDispatch) {
  refreshInvestibles(invDispatch, diffDispatch, [newInv]);
  const targetStage = getFullStage(marketStagesState, marketId, targetStageId);
  if (targetStage.close_comments_on_entrance) {
    resolveInvestibleComments(investibleId, marketId, commentsState, commentsDispatch);
  }
  const messages = findMessagesForInvestibleId(investibleId, messagesState) || [];
  messages.forEach((message) => {
    messagesDispatch(removeMessage(message));
  });
}