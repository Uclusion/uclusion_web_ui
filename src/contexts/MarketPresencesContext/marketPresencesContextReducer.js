import LocalForageHelper from '../../utils/LocalForageHelper'
import { MARKET_PRESENCES_CONTEXT_NAMESPACE } from './MarketPresencesContext'
import _ from 'lodash'

const INITIALIZE_STATE = 'INITIALIZE_STATE';
const ADD_MARKET_PRESENCE = 'ADD_MARKET_PRESENCE';
const ADD_MARKET_PRESENCES = 'ADD_MARKET_PRESENCES';
const UPDATE_MARKET_PRESENCES = 'UPDATE_MARKET_PRESENCES';
const REMOVE_MARKETS_PRESENCE = 'REMOVE_MARKETS_PRESENCE';
const PATCH_INVESTMENT = 'PATCH_INVESTMENT';
const BANNED_MARKETS = 'BANNED_MARKETS';

/** Messages you can send the reducer **/

export function initializeState(newState) {
  return {
    type: INITIALIZE_STATE,
    newState,
  };
}

export function patchInvestment(investmentPatch) {
  return {
    type: PATCH_INVESTMENT,
    investmentPatch,
  };
}

export function processBannedList(bannedList) {
  return {
    type: BANNED_MARKETS,
    bannedList
  }
}

export function addMarketPresence(marketId, user) {
  return {
    type: ADD_MARKET_PRESENCE,
    marketId,
    user,
  };
}

export function addMarketPresences(marketId, users) {
  return {
    type: ADD_MARKET_PRESENCES,
    marketId,
    users,
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

function doPatchInvestment(state, action) {
  const { investmentPatch } = action;
  const {
    market_id,
    quantity,
    max_budget,
    user_id,
    investible_id,
  } = investmentPatch;
  const oldMarketUsers = state[market_id] || [];
  const oldPresence = oldMarketUsers.find((oldUser) => oldUser.id === user_id);
  if (_.isEmpty(oldPresence)) {
    // I don't even have a presence, I can't do anything
    return state;
  }
  const investments = oldPresence.investments || [];
  const oldInvestment = investments.find((investment) => investment.investible_id === investible_id) || {};
  const newInvestment = {
    ...oldInvestment,
    investible_id,
    quantity,
    max_budget
  };
  const newInvestments = _.unionBy([newInvestment], investments, 'investible_id');
  const newPresence = {
    ...oldPresence,
    investments: newInvestments,
  };
  const newMarketUsers = _.unionBy([newPresence], oldMarketUsers, 'id');
  return {
    ...state,
    [market_id]: newMarketUsers,
  };
}



function doAddMarketPresence(state, action) {
  const { marketId, user } = action;
  const oldUsers = state[marketId] || [];
  const newUsers = _.unionBy([user], oldUsers, 'id');
  return {
    ...state,
    [marketId]: newUsers,
  };
}

function doAddMarketPresences(state, action) {
  const { marketId, users } = action;
  const oldUsers = state[marketId] || [];
  const newUsers = _.unionBy(users, oldUsers, 'id');
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

function doProcessBanned(state, action) {
  const { bannedList } = action;
  if (_.isEmpty(bannedList)) {
    // If he has been unbanned then this is a no op because normal market syncing will change his presence
    return state;
  }
  let newState = state;
  bannedList.forEach((marketId) => {
    const oldMarketUsers = state[marketId] || [];
    const myUser = oldMarketUsers.find((user) => user.current_user) || {};
    if (!myUser.market_banned) {
      const newPresence = {
        ...myUser,
        market_banned: true,
      };
      const newMarketUsers = _.unionBy([newPresence], oldMarketUsers, 'id');
      newState = doUpdateMarketPresences(newState, {marketId, users: newMarketUsers})
    }
  });
  return newState;
}

function doRemoveMarketsPresence(state, action) {
  const { marketIds } = action;
  return _.omit(state, marketIds);
}

function computeNewState(state, action) {
  switch (action.type) {
    case INITIALIZE_STATE:
      return {
        ...action.newState,
        initializing: false,
      };
    case ADD_MARKET_PRESENCE:
      return doAddMarketPresence(state, action);
    case ADD_MARKET_PRESENCES:
      return doAddMarketPresences(state, action);
    case UPDATE_MARKET_PRESENCES:
      return doUpdateMarketPresences(state, action);
    case REMOVE_MARKETS_PRESENCE:
      return doRemoveMarketsPresence(state, action);
    case PATCH_INVESTMENT:
      return doPatchInvestment(state, action);
    case BANNED_MARKETS:
      return doProcessBanned(state, action);
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
