import { getMarketStages } from '../../api/markets';
import { updateMarketStages } from './marketStagesContextReducer';
import { AllSequentialMap } from '../../utils/PromiseUtils';

export function getStages(state, marketId) {
  return state[marketId];
}

export function refreshMarketStages(dispatch, marketIds) {
  const updater = (marketId) => {
    return getMarketStages(marketId)
      .then((marketStages) => dispatch(updateMarketStages(marketId, marketStages)));
  };
  return AllSequentialMap(marketIds, updater);
}
