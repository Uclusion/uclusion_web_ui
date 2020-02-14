import LocalForageHelper from '../LocalForageHelper';
import { MARKET_PRESENCES_CONTEXT_NAMESPACE } from './MarketPresencesContext';
import _ from 'lodash';

const INITIALIZE_STATE = 'INITIALIZE_STATE';
const ADD_MARKET_PRESENCE = 'ADD_MARKET_PRESENCE';
const UPDATE_MARKET_PRESENCES = 'UPDATE_MARKET_PRESENCES';
const REMOVE_MARKETS_PRESENCE = 'REMOVE_MARKETS_PRESENCE';

/** Messages you can send the reducer **/

export function initializeState(newState) {
  return {
    type: INITIALIZE_STATE,
    newState,
  };
}

export function addMarketPresence(marketId, user) {
  return {
    type: ADD_MARKET_PRESENCE,
    marketId,
    user,
  };
}

export function updateMarketPresences(marketId, users) {
  return {
    type: UPDATE_MARKET_PRESENCES,
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
function doAddMarketPresence(state, action) {
  const { marketId, user } = action;
  const oldUsers = state[marketId] || [];
  const newUsers = _.unionBy([user], oldUsers, 'id');
  return {
    ...state,
    [marketId]: newUsers,
  };
}

function doUpdateMarketPresences(state, action) {
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
    case ADD_MARKET_PRESENCE:
      return doAddMarketPresence(state, action);
    case UPDATE_MARKET_PRESENCES:
      return doUpdateMarketPresences(state, action);
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
