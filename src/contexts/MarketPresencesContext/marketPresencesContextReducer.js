import LocalForageHelper from '../LocalForageHelper';
import { MARKET_PRESENCES_CONTEXT_NAMESPACE } from './MarketPresencesContext';
import _ from 'lodash';

const INITIALIZE_STATE = 'INITIALIZE_STATE';
const UPDATE_MARKET_PRESENCE = 'UPDATE_MARKET_PRESENCE';
const REMOVE_MARKETS_PRESENCE = 'REMOVE_MARKETS_PRESENCE';

/** Messages you can send the reducer **/

export function initializeState(newState) {
  return {
    type: INITIALIZE_STATE,
    newState,
  };
}

export function updateMarketPresence(marketId, users) {
  return {
    type: UPDATE_MARKET_PRESENCE,
    marketId,
    users,
  };
}

export function removeMarketsPresence(marketIds) {
  return {
    type: REMOVE_MARKETS_PRESENCE,
    marketIds,
  };
}

/** Functions that update the state **/

function doUpdateMarketPresence(state, action) {
  const { marketId, users } = action;
  return {
    ...state,
    [marketId]: users,
  };
}

function doRemoveMarketsPresence(state, action) {
  const { marketIds } = action;
  return _.omit(state, marketIds);
}

function computeNewState(state, action) {
  switch (action.type) {
    case INITIALIZE_STATE:
      return action.newState;
    case UPDATE_MARKET_PRESENCE:
      return doUpdateMarketPresence(state, action);
    case REMOVE_MARKETS_PRESENCE:
      return doRemoveMarketsPresence(state, action);
    default:
      return state;
  }
}

function reducer(state, action) {
  const newState = computeNewState(state, action);
  const lfh = new LocalForageHelper(MARKET_PRESENCES_CONTEXT_NAMESPACE);
  lfh.setState(newState);
  return newState;
}

export default reducer;
