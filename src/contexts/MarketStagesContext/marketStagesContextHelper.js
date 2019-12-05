import { getMarketStages } from '../../api/markets';
import { updateMarketStages } from './marketStagesContextReducer';
import { AllSequentialMap } from '../../utils/PromiseUtils';

export function getStages(state, marketId) {
  return state[marketId];
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
  return marketStages.find((stage) => (!stage.allows_investment && stage.singular_only));
}

export function getInReviewStage(state, marketId) {
  const marketStages = getStages(state, marketId);
  return marketStages.find((stage) => (!stage.singular_only && stage.appears_in_context));
}

export function getVerifiedStage(state, marketId) {
  const marketStages = getStages(state, marketId);
  return marketStages.find((stage) => (stage.appears_in_market_summary));
}

export function getNotDoingStage(state, marketId) {
  const marketStages = getStages(state, marketId);
  // eslint-disable-next-line max-len
  return marketStages.find((stage) => (!stage.appears_in_context && !stage.appears_in_market_summary));
}

export function refreshMarketStages(dispatch, marketIds) {
  const updater = (marketId) => getMarketStages(marketId)
    .then((marketStages) => dispatch(updateMarketStages(marketId, marketStages)));
  return AllSequentialMap(marketIds, updater);
}
