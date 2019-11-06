import { getMarketStages } from '../../api/markets';
import { updateMarketStages } from './marketStagesContextReducer';
import { AllSequential } from '../../utils/PromiseUtils';

export function getStages(state, marketId) {
  return state[marketId];
}

export function refreshMarketStages(dispatch, marketIds) {
  const promises = marketIds.map((marketId) => getMarketStages(marketId)
    .then((marketStages) => {
      dispatch(updateMarketStages(marketId, marketStages));
    }));
  return AllSequential(promises);
}
