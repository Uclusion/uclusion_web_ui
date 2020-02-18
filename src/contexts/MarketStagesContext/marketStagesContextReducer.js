import _ from 'lodash';
import LocalForageHelper from '../LocalForageHelper';
import { MARKET_STAGES_CONTEXT_NAMESPACE } from './MarketStagesContext';

const INITIALIZE_STATE = 'INITIALIZE_STATE';
const UPDATE_MARKET_STAGES = 'UPDATE_MARKET_STAGES';
const REMOVE_MARKET_STAGES = 'REMOVE_MARKET_STAGES';
/** Messages we can send the reducer **/

export function initializeState(newState) {
  return {
    type: INITIALIZE_STATE,
    newState,
  };
}

export function updateMarketStages(marketId, stagesList) {
  return {
    type: UPDATE_MARKET_STAGES,
    marketId,
    stagesList,
  };
}

export function removeMarketsStageDetails(marketIds) {
  return {
    type: REMOVE_MARKET_STAGES,
    marketIds,
  };
}

/** Functions that generate the new state **/

function doUpdateMarketStages(state, action) {
  const { marketId, stagesList } = action;
  return {
    ...state,
    [marketId]: stagesList,
  };
}

function removeMarketStages(state, action) {
  const { marketIds } = action;
  return _.omit(state, marketIds);
}

function computeNewState(state, action) {
  switch (action.type) {
    case INITIALIZE_STATE:
      return action.newState;
    case UPDATE_MARKET_STAGES:
      return doUpdateMarketStages(state, action);
    case REMOVE_MARKET_STAGES:
      return removeMarketStages(state, action);
    default:
      return state;
  }
}

function reducer(state, action) {
  const newState = computeNewState(state, action);
  const lfh = new LocalForageHelper(MARKET_STAGES_CONTEXT_NAMESPACE);
  lfh.setState(newState);
  return newState;
}

export default reducer;
