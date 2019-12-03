import { getMarketStages } from '../../api/markets';
import { updateMarketStages } from './marketStagesContextReducer';
import { AllSequentialMap } from '../../utils/PromiseUtils';

export function getStages(state, marketId) {
  return state[marketId];
}

export function getInCurrentVotingStage(state, marketId) {
  const marketStages = getStages(state, marketId);
  const underConsiderationStage = marketStages.find((stage) => stage.allows_investment);
  return underConsiderationStage;
}

export function getProposedOptionsStage(state, marketId ) {
  const marketStages = getStages(state, marketId);
  const proposedStage = marketStages.find((stage) => !stage.allows_investment && !stage.appears_in_market_summary);
  return proposedStage;
}

export function refreshMarketStages(dispatch, marketIds) {
  const updater = (marketId) => {
    return getMarketStages(marketId)
      .then((marketStages) => dispatch(updateMarketStages(marketId, marketStages)));
  };
  return AllSequentialMap(marketIds, updater);
}

