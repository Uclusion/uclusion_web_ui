import { updateMarketStages } from './marketGroupsContextReducer';
import _ from 'lodash'

export function updateStagesForMarket(dispatch, marketId, newStages){
  dispatch(updateMarketStages(marketId, newStages));
}

export function getStages(state, marketId) {
  if (!state) {
    return [];
  }
  return state[marketId] || [];
}

export function getInCurrentVotingStage(state, marketId) {
  const marketStages = getStages(state, marketId);
  return marketStages.find((stage) => stage.allows_investment);
}

export function getProposedOptionsStage(state, marketId) {
  const marketStages = getStages(state, marketId);
  return marketStages.find((stage) => !stage.allows_investment);
}

export function isAcceptedStage(stage) {
  return stage.assignee_enter_only;
}

export function getAcceptedStage(state, marketId) {
  const marketStages = getStages(state, marketId);
  return marketStages.find((stage) => isAcceptedStage(stage));
}

export function isInReviewStage(stage) {
  return !stage.appears_in_market_summary && stage.appears_in_context && !stage.assignee_enter_only
    && !stage.allows_investment;
}

export function getInReviewStage(state, marketId) {
  const marketStages = getStages(state, marketId);
  return marketStages.find((stage) => isInReviewStage(stage));
}

export function isBlockedStage(stage) {
  return stage.allows_issues && stage.move_on_comment;
}

export function getBlockedStage(state, marketId) {
  const marketStages = getStages(state, marketId);
  return marketStages.find((stage) => isBlockedStage(stage));
}

export function getVerifiedStage(state, marketId) {
  const marketStages = getStages(state, marketId);
  return marketStages.find((stage) => (stage.appears_in_market_summary));
}

export function isFurtherWorkStage(stage) {
  return !stage.allows_assignment && !stage.close_comments_on_entrance;
}

export function getFurtherWorkStage(state, marketId) {
  const marketStages = getStages(state, marketId);
  return marketStages.find((stage) => isFurtherWorkStage(stage));
}

export function getFullStage(state, marketId, stageId) {
  const marketStages = getStages(state, marketId);
  return marketStages.find((stage) => stage.id === stageId);
}

export function isRequiredInputStage(stage) {
  return !stage.allows_issues && stage.move_on_comment;
}

export function getRequiredInputStage(state, marketId) {
  const marketStages = getStages(state, marketId);
  return marketStages.find((stage) => isRequiredInputStage(stage));
}

export function getNotDoingStage(state, marketId) {
  const marketStages = getStages(state, marketId);
  return marketStages.find((stage) => (!stage.allows_assignment && stage.close_comments_on_entrance));
}

export function getStageNameForId(state, marketId, stageId, intl) {
  const fullStage = getFullStage(state, marketId, stageId);
  if (_.isEmpty(fullStage)) {
    return '';
  }
  if (isInReviewStage(fullStage)) {
    return intl.formatMessage({ id: 'planningInvestibleNextStageInReviewLabel' });
  }
  if (isAcceptedStage(fullStage)) {
    return intl.formatMessage({ id: 'planningInvestibleNextStageAcceptedLabel' });
  }
  if (fullStage.allows_investment) {
    return intl.formatMessage({ id: 'planningInvestibleToVotingLabel' });
  }
}