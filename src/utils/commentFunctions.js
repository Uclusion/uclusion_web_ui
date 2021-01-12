import _ from 'lodash'
import { addInvestible, getInvestible } from '../contexts/InvestibesContext/investiblesContextHelper'
import { getBlockedStage, getRequiredInputStage } from '../contexts/MarketStagesContext/marketStagesContextHelper'
import { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE } from '../constants/comments'
import { addCommentToMarket } from '../contexts/CommentsContext/commentsContextHelper'

export function scrollToCommentAddBox() {
  const box = document.getElementById('cabox');
  if (box) {
    box.scrollIntoView();
  }
}

export function onCommentOpen(investibleState, investibleId, marketStagesState, marketId, comment, investibleDispatch,
  commentsState, commentsDispatch, versionsDispatch) {
  const inv = getInvestible(investibleState, investibleId) || {}
  const { market_infos, investible: rootInvestible } = inv
  const [info] = (market_infos || [])
  const { assigned, stage: currentStageId } = (info || {})
  const blockingStage = getBlockedStage(marketStagesState, marketId) || {}
  const requiresInputStage = getRequiredInputStage(marketStagesState, marketId) || {}
  const investibleRequiresInput = ((comment.comment_type === QUESTION_TYPE ||
    comment.comment_type === SUGGEST_CHANGE_TYPE)
    && (assigned || []).includes(comment.created_by)) && currentStageId !== blockingStage.id
    && currentStageId !== requiresInputStage.id
  const investibleBlocks = (investibleId && comment.comment_type === ISSUE_TYPE)
    && currentStageId !== blockingStage.id
  changeInvestibleStageOnCommentChange(investibleBlocks, investibleRequiresInput,
    blockingStage, requiresInputStage, info, market_infos, rootInvestible, investibleDispatch)
  addCommentToMarket(comment, commentsState, commentsDispatch, versionsDispatch)
}

export function changeInvestibleStageOnCommentChange(investibleBlocks, investibleRequiresInput,
  blockingStage, requiresInputStage, info, market_infos, rootInvestible, investibleDispatch) {
  if (investibleBlocks || investibleRequiresInput) {
    const newStage = investibleBlocks ? blockingStage : requiresInputStage;
    if (newStage.id) {
      const newInfo = {
        ...info,
        stage: newStage.id,
        stage_name: newStage.name,
        open_for_investment: false,
        last_stage_change_date: Date.now().toString(),
      };
      const newInfos = _.unionBy([newInfo], market_infos, 'id');
      const newInvestible = {
        investible: rootInvestible,
        market_infos: newInfos
      };
      // no diff here, so no diff dispatch
      addInvestible(investibleDispatch, ()=> {}, newInvestible);
    }
  }
}