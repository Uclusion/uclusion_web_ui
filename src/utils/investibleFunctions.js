import { refreshInvestibles } from '../contexts/InvestibesContext/investiblesContextHelper';
import { getFullStage, isFurtherWorkStage } from '../contexts/MarketStagesContext/marketStagesContextHelper';
import {
  clearInvestibleInProgress,
  reopenAutoclosedInvestibleComments,
  resolveInvestibleComments
} from '../contexts/CommentsContext/commentsContextHelper';
import { NOT_FULLY_VOTED_TYPE, REPORT_REQUIRED, UNREAD_JOB_APPROVAL_REQUEST } from '../constants/notifications';
import { pushMessage } from './MessageBusUtils';
import {
  MODIFY_NOTIFICATIONS_CHANNEL,
  STAGE_CHANGE_EVENT
} from '../contexts/NotificationsContext/notificationsContextMessages';
import { removeInvestments } from '../contexts/MarketPresencesContext/marketPresencesContextReducer';

export function onInvestibleStageChange(targetStageId, newInv, investibleId, marketId, commentsState, commentsDispatch,
  invDispatch, diffDispatch, marketStagesState, removeTypes, fullStage, marketPresencesDispatch) {
  refreshInvestibles(invDispatch, diffDispatch, [newInv]);
  const targetStage = getFullStage(marketStagesState, marketId, targetStageId) || {};
  if (targetStageId && marketStagesState && commentsState) {
    if (targetStage.close_comments_on_entrance) {
      resolveInvestibleComments(investibleId, marketId, commentsState, commentsDispatch);
    }
  }
  if (isFurtherWorkStage(targetStage)) {
    if (marketPresencesDispatch) {
      marketPresencesDispatch(removeInvestments(marketId, investibleId));
    }
    // The backend clears in_progress on the job's tasks when it returns to the backlog - quick add it
    // so the task ordering doesn't stay stuck showing in_progress tasks ahead of the others.
    if (commentsState && commentsDispatch) {
      clearInvestibleInProgress(investibleId, marketId, commentsState, commentsDispatch);
    }
  }
  if (fullStage.close_comments_on_entrance && commentsState && commentsDispatch) {
    reopenAutoclosedInvestibleComments(investibleId, marketId, commentsState, commentsDispatch);
  }
  let useRemoveTypes = removeTypes;
  if (!useRemoveTypes) {
    useRemoveTypes = [NOT_FULLY_VOTED_TYPE, REPORT_REQUIRED, UNREAD_JOB_APPROVAL_REQUEST];
  }
  pushMessage(MODIFY_NOTIFICATIONS_CHANNEL, { event: STAGE_CHANGE_EVENT, investibleId, useRemoveTypes });
}