import _ from 'lodash'
import LocalForageHelper from '../../utils/LocalForageHelper'
import { MARKET_CONTEXT_NAMESPACE, MARKETS_CHANNEL, MEMORY_MARKET_CONTEXT_NAMESPACE } from './MarketsContext'
import { BroadcastChannel } from 'broadcast-channel'

const INITIALIZE_STATE = 'INITIALIZE_STATE';
const REPLACE_STATE = 'REPLACE_STATE';
const UPDATE_MARKET_DETAILS = 'UPDATE_MARKET_DETAILS';
const REMOVE_MARKET_DETAILS = 'REMOVE_MARKET_DETAILS';
const UPDATE_FROM_VERSIONS = 'UPDATE_FROM_VERSIONS';

/* Possible messages to the reducer */
export function initializeState(newState) {
  return {
    type: INITIALIZE_STATE,
    newState,
  };
}

export function replaceState(newState) {
  return {
    type: REPLACE_STATE,
    newState,
  };
}

export function updateMarketDetails(marketDetails) {
  return {
    type: UPDATE_MARKET_DETAILS,
    marketDetails,
  };
}

export function versionsUpdateDetails(marketDetails) {
  return {
    type: UPDATE_FROM_VERSIONS,
    marketDetails,
  };
}

export function removeMarketDetails(marketIds) {
  return {
    type: REMOVE_MARKET_DETAILS,
    marketIds,
  };
}

/* Functions that mutate state */

function doUpdateMarketDetails(state, action) {
  const { marketDetails } = action;
  const { marketDetails: oldMarketDetails } = state;
  const newDetails = _.unionBy(marketDetails, oldMarketDetails, 'id');
  const { initializing } = state;
  if (initializing) {
    return {
      marketDetails: newDetails,
    };
  }
  return {
    ...state,
    marketDetails: newDetails,
  };
}

function removeStoredMarkets(state, action) {
  const { marketIds } = action;
  const { marketDetails } = state;
  const newMarketDetails = marketDetails.filter((market) => (!marketIds.includes(market.id)));
  return {
    ...state,
    marketDetails: newMarketDetails,
  };
}

function computeNewState(state, action) {
  // console.debug(`Computing state with type ${action.type}`);
  switch (action.type) {
    case UPDATE_MARKET_DETAILS:
    case UPDATE_FROM_VERSIONS:
      return doUpdateMarketDetails(state, action);
    case REMOVE_MARKET_DETAILS:
      return removeStoredMarkets(state, action);
    case REPLACE_STATE:
      return action.newState;
    case INITIALIZE_STATE:
      if (state.initializing) {
        return action.newState;
      }
      return state;
    default:
      return state;
  }
}

function reducer(state, action) {
  const newState = computeNewState(state, action);
  if (action.type === UPDATE_FROM_VERSIONS) {
    const lfh = new LocalForageHelper(MARKET_CONTEXT_NAMESPACE);
    lfh.setState(newState);
  } else if (action.type === UPDATE_MARKET_DETAILS) {
    const lfh = new LocalForageHelper(MEMORY_MARKET_CONTEXT_NAMESPACE);
    lfh.setState(newState).then(() => {
      const myChannel = new BroadcastChannel(MARKETS_CHANNEL);
      return myChannel.postMessage('markets').then(() => myChannel.close());
    }).then(() => console.info('Update market context sent.'));
  }
  return newState;
}

export default reducer;
