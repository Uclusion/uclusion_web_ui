import { updateMarketStages } from './marketStagesContextReducer';

export function updateStagesForMarket(dispatch, marketId, newStages){
  dispatch(updateMarketStages(marketId, newStages));
}

export function getStages(state, marketId) {
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

export function getAcceptedStage(state, marketId) {
  const marketStages = getStages(state, marketId);
  return marketStages.find((stage) => stage.assignee_enter_only);
}

export function isInReviewStage(stage) {
  return !stage.appears_in_market_summary && stage.appears_in_context && !stage.assignee_enter_only
    && !stage.allows_investment;
}

export function getInReviewStage(state, marketId) {
  const marketStages = getStages(state, marketId);
  return marketStages.find((stage) => isInReviewStage(stage));
}

export function getBlockedStage(state, marketId) {
  const marketStages = getStages(state, marketId);
  return marketStages.find((stage) => (stage.allows_issues && stage.move_on_comment));
}

export function getVerifiedStage(state, marketId) {
  const marketStages = getStages(state, marketId);
  return marketStages.find((stage) => (stage.appears_in_market_summary));
}

export function getFurtherWorkStage(state, marketId) {
  const marketStages = getStages(state, marketId);
  return marketStages.find((stage) => (!stage.allows_assignment && !stage.close_comments_on_entrance));
}

export function getFullStage(state, marketId, stageId) {
  const marketStages = getStages(state, marketId);
  return marketStages.find((stage) => stage.id === stageId);
}

export function getRequiredInputStage(state, marketId) {
  const marketStages = getStages(state, marketId);
  return marketStages.find((stage) => (!stage.allows_issues && stage.move_on_comment));
}

export function getNotDoingStage(state, marketId) {
  const marketStages = getStages(state, marketId);
  return marketStages.find((stage) => (!stage.allows_assignment && stage.close_comments_on_entrance));
}
