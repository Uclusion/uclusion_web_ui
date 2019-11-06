import { getMarketStages } from '../../api/markets';
import { updateMarketStages } from './marketStagesContextReducer';

export function getStages(state, marketId) {
  return state[marketId];
}

export function refreshMarketStages(dispatch, marketIds) {
  const promises = marketIds.map((marketId) => getMarketStages(marketId)
    .then((marketStages) => {
      dispatch(updateMarketStages(marketId, marketStages));
    }));
  Promise.all(promises);
}
