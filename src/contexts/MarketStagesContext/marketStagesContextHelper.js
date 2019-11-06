import { getMarketStages } from '../../api/markets';
import { updateMarketStages } from './marketStagesContextReducer';
import { AllSequentialMap } from '../../utils/PromiseUtils';

export function getStages(state, marketId) {
  return state[marketId];
}

export function refreshMarketStages(dispatch, marketIds) {
  return AllSequentialMap(marketIds, (marketId) => getMarketStages(marketId)
    .then((marketStages) => {
      dispatch(updateMarketStages(marketId, marketStages));
    }));
}
