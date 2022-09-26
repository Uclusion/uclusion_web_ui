import {
  getAcceptedStage,
  getBlockedStage, getFurtherWorkStage, getInCurrentVotingStage,
  getInReviewStage, getNotDoingStage, getRequiredInputStage, getVerifiedStage
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
  const inVerifiedStage = getVerifiedStage(marketStagesState, marketId) || {};
  const isInVerified = inVerifiedStage && currentStageId === inVerifiedStage.id;
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
    inVerifiedStage,
    isInVerified,
    furtherWorkStage,
    isFurtherWork,
    requiresInputStage,
    isRequiresInput,
    notDoingStage,
    isInNotDoing,
  };
}


export function getCurrentStageLabelId(stagesInfo) {
  if(stagesInfo.isInReview){
    return 'planningReviewStageLabel'
  }
  // TODO, handle full
  if(stagesInfo.isInAccepted){
    return 'planningAcceptedStageLabel';
  }
  if(stagesInfo.isInBlocked){
    return 'planningBlockedStageLabel';
  }
  if(stagesInfo.isInVerified){
    return 'planningVerifiedStageLabel';
  }
  if(stagesInfo.isFurtherWork){
    return 'planningFurtherWorkStageLabel';
  }
  if(stagesInfo.isRequiresInput){
    return 'requiresInputStageLabel';
  }
  if(stagesInfo.isInNotDoing){
    return 'planningNotDoingStageLabel';
  }
  if(stagesInfo.isInVoting){
    return 'planningVotingStageLabel';
  }
  // just put something that makes vague sense
  return 'allowedStagesDropdownLabel';
}