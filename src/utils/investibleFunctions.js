import { refreshInvestibles } from '../contexts/InvestibesContext/investiblesContextHelper';
import { getFullStage, isFurtherWorkStage } from '../contexts/MarketStagesContext/marketStagesContextHelper';
import {
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
import { getCommenterPresences } from '../pages/Dialog/Planning/userUtils';
import _ from 'lodash';

export function onInvestibleStageChange(targetStageId, newInv, investibleId, marketId, commentsState, commentsDispatch,
  invDispatch, diffDispatch, marketStagesState, removeTypes, fullStage, marketPresencesDispatch) {
  refreshInvestibles(invDispatch, diffDispatch, [newInv]);
  const targetStage = getFullStage(marketStagesState, marketId, targetStageId) || {};
  if (targetStageId && marketStagesState && commentsState) {
    if (targetStage.close_comments_on_entrance) {
      resolveInvestibleComments(investibleId, marketId, commentsState, commentsDispatch);
    }
  }
  if (marketPresencesDispatch && isFurtherWorkStage(targetStage)) {
    marketPresencesDispatch(removeInvestments(marketId, investibleId));
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

export function getCollaboratorsForInvestible(id, marketId, comments, votersForInvestible, marketPresences,
  marketPresencesState, isVoting) {
  const commentsForInvestible = comments.filter((comment) => comment.investible_id === id);
  const commenterPresences = getCommenterPresences(marketPresences, commentsForInvestible, marketPresencesState);
  const concated = isVoting ? votersForInvestible : commenterPresences;
  return _.uniqBy(concated, 'id');
}