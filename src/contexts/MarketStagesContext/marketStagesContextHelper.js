import { getMarketStages } from '../../api/markets';
import { updateMarketStages } from './marketStagesContextReducer';

export function getStages(state, marketId) {
  return state[marketId];
}

export function refreshMarketStages(dispatch, marketId) {
  return getMarketStages(marketId)
    .then((marketStages) => {
      dispatch(updateMarketStages(marketId, marketStages));
    });
}
