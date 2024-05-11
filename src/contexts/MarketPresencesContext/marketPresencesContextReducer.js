import LocalForageHelper from '../../utils/LocalForageHelper'
import {
  MARKET_PRESENCES_CONTEXT_NAMESPACE,
  PRESENCE_CHANNEL
} from './MarketPresencesContext'
import _ from 'lodash'
import { BroadcastChannel } from 'broadcast-channel'
import { broadcastId } from '../../components/ContextHacks/BroadcastIdProvider'
import { removeInitializing } from '../../components/localStorageUtils'
import { addByIdAndVersion } from '../ContextUtils'
import { syncMarketList } from '../../components/ContextHacks/ForceMarketSyncProvider';

const INITIALIZE_STATE = 'INITIALIZE_STATE';
const ADD_MARKET_PRESENCE = 'ADD_MARKET_PRESENCE';
const ADD_MARKET_PRESENCES = 'ADD_MARKET_PRESENCES';
const UPDATE_FROM_VERSIONS = 'UPDATE_FROM_VERSIONS';
const REMOVE_MARKETS_PRESENCE = 'REMOVE_MARKETS_PRESENCE';
const REMOVE_INVESTIBLE_INVESTMENTS = 'REMOVE_INVESTIBLE_INVESTMENTS'
const PATCH_INVESTMENT = 'PATCH_INVESTMENT';
const BANNED_MARKETS = 'BANNED_MARKETS';

/** Messages you can send the reducer **/

export function initializeState(newState) {
  return {
    type: INITIALIZE_STATE,
    newState,
  };
}

export function patchInvestment(investmentPatch, allowMultiVote) {
  return {
    type: PATCH_INVESTMENT,
    investmentPatch,
    allowMultiVote
  };
}

export function removeInvestments(marketId, investibleId) {
  return {
    type: REMOVE_INVESTIBLE_INVESTMENTS,
    marketId,
    investibleId
  };
}

export function processBanned(bannedList) {
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
    users
  };
}

export function versionsUpdateMarketPresences(userDetails) {
  return {
    type: UPDATE_FROM_VERSIONS,
    userDetails
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
  const { investmentPatch, allowMultiVote } = action;
  syncMarketList.push(investmentPatch.market_id);
  const oldMarketUsers = state[investmentPatch.market_id] || [];
  const oldPresence = oldMarketUsers.find((oldUser) => oldUser.id === investmentPatch.user_id);
  if (_.isEmpty(oldPresence)) {
    // I don't even have a presence, I can't do anything
    return state;
  }
  const investments = oldPresence.investments || [];
  const newInvestments = allowMultiVote ?  _.unionBy([investmentPatch], investments, 'investible_id')
    : [investmentPatch];
  const newPresence = {
    ...oldPresence,
    investments: newInvestments
  };
  const newMarketUsers = _.unionBy([newPresence], oldMarketUsers, 'id');
  return {
    ...state,
    [investmentPatch.market_id]: newMarketUsers,
  };
}



function doAddMarketPresence(state, action) {
  const { marketId, user } = action;
  syncMarketList.push(marketId);
  const oldUsers = state[marketId] || [];
  const newUsers = _.unionBy([user], oldUsers, 'id');
  return {
    ...state,
    [marketId]: newUsers,
  };
}

function doAddMarketPresences(state, action) {
  const { marketId, users } = action;
  syncMarketList.push(marketId);
  const oldUsers = state[marketId] || [];
  const newUsers = _.unionBy(users, oldUsers, 'id');
  return {
    ...state,
    [marketId]: newUsers,
  };
}

function doUpdateMarketPresences(state, action) {
  const { userDetails } = action;
  const newState = {...state};
  Object.keys(userDetails).forEach((marketId) => {
    // Avoid clobbering presences that were quick added
    newState[marketId] = addByIdAndVersion(userDetails[marketId], newState[marketId]);
  });
  return removeInitializing(newState);
}

function doRemoveInvestibleInvestments(state, action) {
  const { marketId, investibleId } = action;
  syncMarketList.push(marketId);
  const oldUsers = state[marketId] || [];
  const transformedUsers = oldUsers.map((user) => {
    const newInvestments = user.investments?.filter((investment) =>
      investment.investible_id !== investibleId);
    return {
      ...user,
      investments: newInvestments
    };
  });
  return {
    ...state,
    [marketId]: transformedUsers,
  };
}

// This can only come from the network
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
      newState = doUpdateMarketPresences(newState, {userDetails: {[marketId]: newMarketUsers}})
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
      return action.newState;
    case ADD_MARKET_PRESENCE:
      return doAddMarketPresence(state, action);
    case ADD_MARKET_PRESENCES:
      return doAddMarketPresences(state, action);
    case UPDATE_FROM_VERSIONS:
      return doUpdateMarketPresences(state, action);
    case REMOVE_MARKETS_PRESENCE:
      return doRemoveMarketsPresence(state, action);
    case PATCH_INVESTMENT:
      return doPatchInvestment(state, action);
    case BANNED_MARKETS:
      return doProcessBanned(state, action);
    case REMOVE_INVESTIBLE_INVESTMENTS:
      return doRemoveInvestibleInvestments(state, action);
    default:
      return state;
  }
}

let presencesStoragePromiseChain = Promise.resolve(true);

function reducer(state, action) {
  const newState = computeNewState(state, action);
  if (action.type !== INITIALIZE_STATE) {
    const lfh = new LocalForageHelper(MARKET_PRESENCES_CONTEXT_NAMESPACE);
    presencesStoragePromiseChain = presencesStoragePromiseChain.then(() => {
        lfh.setState(newState).then(() => {
          const myChannel = new BroadcastChannel(PRESENCE_CHANNEL);
          return myChannel.postMessage(broadcastId || 'presence').then(() => myChannel.close())
            .then(() => console.info('Update presence context sent.'));
        });
    });
  }
  return newState;
}

export default reducer;
