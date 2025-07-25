import {
  getAcceptedStage,
  getBlockedStage, getFurtherWorkStage, getInCurrentVotingStage,
  getInReviewStage, getNotDoingStage, getRequiredInputStage
} from '../contexts/MarketStagesContext/marketStagesContextHelper';

export function getStagesInfo(marketId, marketStagesState, currentStageId){
  const inVotingStage = getInCurrentVotingStage(marketStagesState, marketId);
  const isInVoting = inVotingStage && currentStageId === inVotingStage.id;
  const inReviewStage = getInReviewStage(marketStagesState, marketId) || {};
  const isInReview = inReviewStage && currentStageId === inReviewStage.id;
  const inAcceptedStage = getAcceptedStage(marketStagesState, marketId) || {};
  const isInAccepted = inAcceptedStage && currentStageId === inAcceptedStage.id;
  const inBlockedStage = getBlockedStage(marketStagesState, marketId) || {};
  const isInBlocked = inBlockedStage && currentStageId === inBlockedStage.id;
  const furtherWorkStage = getFurtherWorkStage(marketStagesState, marketId) || {};
  const isFurtherWork = furtherWorkStage && currentStageId === furtherWorkStage.id;
  const requiresInputStage = getRequiredInputStage(marketStagesState, marketId) || {};
  const isRequiresInput = requiresInputStage && currentStageId === requiresInputStage.id;
  const notDoingStage = getNotDoingStage(marketStagesState, marketId);
  const isInNotDoing = notDoingStage && currentStageId === notDoingStage.id;
  return {
    inVotingStage,
    isInVoting,
    inReviewStage,
    isInReview,
    inAcceptedStage,
    isInAccepted,
    inBlockedStage,
    isInBlocked,
    furtherWorkStage,
    isFurtherWork,
    requiresInputStage,
    isRequiresInput,
    notDoingStage,
    isInNotDoing,
  };
}