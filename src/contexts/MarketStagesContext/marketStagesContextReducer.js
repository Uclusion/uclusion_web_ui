import _ from 'lodash'
import { removeInitializing } from '../../components/localStorageUtils'
import { addByIdAndVersion } from '../ContextUtils';
import { leaderContextHack } from '../LeaderContext/LeaderContext';
import LocalForageHelper from '../../utils/LocalForageHelper';
import { MARKET_STAGES_CONTEXT_NAMESPACE } from './MarketStagesContext';

const INITIALIZE_STATE = 'INITIALIZE_STATE';
const UPDATE_MARKET_STAGES = 'UPDATE_MARKET_STAGES';
const REMOVE_MARKET_STAGES = 'REMOVE_MARKET_STAGES';
const UPDATE_MARKET_STAGES_FROM_NETWORK = 'UPDATE_MARKET_STAGES_FROM_NETWORK';

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

export function updateMarketStagesFromNetwork(stageDetails) {
  return {
    type: UPDATE_MARKET_STAGES_FROM_NETWORK,
    stageDetails
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
    ...removeInitializing(state),
    [marketId]: stagesList,
  };
}

function doUpdateMarketsStages(state, action) {
  const { stageDetails } = action;
  const newState = {...state};
  Object.keys(stageDetails).forEach((marketId) => {
    newState[marketId] = addByIdAndVersion(stageDetails[marketId], newState[marketId]);
  });
  return removeInitializing(newState);
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
    case UPDATE_MARKET_STAGES_FROM_NETWORK:
      return doUpdateMarketsStages(state, action);
    case REMOVE_MARKET_STAGES:
      return removeMarketStages(state, action);
    default:
      return state;
  }
}

let marketStagesStoragePromiseChain = Promise.resolve(true);

function reducer(state, action) {
  const newState = computeNewState(state, action);
  if (action.type !== INITIALIZE_STATE) {
    const { isLeader } = leaderContextHack;
    if (isLeader) {
      const lfh = new LocalForageHelper(MARKET_STAGES_CONTEXT_NAMESPACE);
      marketStagesStoragePromiseChain = marketStagesStoragePromiseChain.then(() => {
        return lfh.setState(newState).then(() => {
          console.info('Updated stages context storage.');
        });
      });
    }
  }
  return newState;
}

export default reducer;
