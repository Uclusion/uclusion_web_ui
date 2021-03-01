import LocalForageHelper from '../../utils/LocalForageHelper'
import {
  INVESTIBLES_CHANNEL,
  INVESTIBLES_CONTEXT_NAMESPACE
} from './InvestiblesContext'
import { BroadcastChannel } from 'broadcast-channel'
import { broadcastId } from '../../components/ContextHacks/BroadcastIdProvider'
import _ from 'lodash'

const INITIALIZE_STATE = 'INITIALIZE_STATE';
const UPDATE_INVESTIBLES = 'UPDATE_INVESTIBLES';
const UPDATE_FROM_VERSIONS = 'UPDATE_FROM_VERSIONS';

/** Possible messages to reducer * */

export function initializeState(newState) {
  return {
    type: INITIALIZE_STATE,
    newState,
  };
}

export function updateStorableInvestibles(investibles) {
  return {
    type: UPDATE_INVESTIBLES,
    investibles,
  };
}

export function versionsUpdateInvestibles(investibles) {
  return {
    type: UPDATE_FROM_VERSIONS,
    investibles,
  };
}


/** Reducer functions */

// expects that the investibles are already in a storable state
function doUpdateInvestibles(state, action, isQuickAdd) {
  const { investibles } = action;
  const transformedInvestibles = isQuickAdd ? investibles.map((inv) => {
    const { investible, market_infos: marketInfos } = inv;
    const newInvestible = { ...investible, fromQuickAdd: true };
    const newMarketInfos = marketInfos.map((marketInfo) => {
      return { ...marketInfo, fromQuickAdd: true };
    });
    return { investible: newInvestible, market_infos: newMarketInfos };
  }) : investibles;
  const investibleHash = _.keyBy(transformedInvestibles, (item) => item.investible.id);
  if (!isQuickAdd && state.initializing) {
    // In case network beats the initialization
    delete state.initializing;
  }
  return { ...state, ...investibleHash };
}

function computeNewState(state, action) {
  switch (action.type) {
    case UPDATE_INVESTIBLES:
      return doUpdateInvestibles(state, action, true);
    case UPDATE_FROM_VERSIONS:
      return doUpdateInvestibles(state, action);
    case INITIALIZE_STATE:
      return action.newState;
    default:
      return state;
  }
}

let investiblesStoragePromiseChain = Promise.resolve(true);

function reducer(state, action) {
  const newState = computeNewState(state, action);

  const lfh = new LocalForageHelper(INVESTIBLES_CONTEXT_NAMESPACE);
  investiblesStoragePromiseChain = investiblesStoragePromiseChain.then(() =>lfh.setState(newState)).then(() => {
    if (action.type !== INITIALIZE_STATE) {
      const myChannel = new BroadcastChannel(INVESTIBLES_CHANNEL);
      return myChannel.postMessage(broadcastId || 'investibles').then(() => myChannel.close())
        .then(() => console.info('Update investible context sent.'));
    }
  });
  return newState;
}

export default reducer;
