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

const INITIALIZE_STATE = 'INITIALIZE_STATE';
const ADD_MARKET_PRESENCE = 'ADD_MARKET_PRESENCE';
const ADD_MARKET_PRESENCES = 'ADD_MARKET_PRESENCES';
const UPDATE_FROM_VERSIONS = 'UPDATE_FROM_VERSIONS';
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

export function patchInvestment(investmentPatch, allowMultiVote) {
  return {
    type: PATCH_INVESTMENT,
    investmentPatch,
    allowMultiVote
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

export function versionsUpdateMarketPresences(marketId, users) {
  return {
    type: UPDATE_FROM_VERSIONS,
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
  const { investmentPatch, allowMultiVote } = action;
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
    investments: newInvestments,
    fromQuickAdd: true
  };
  const newMarketUsers = _.unionBy([newPresence], oldMarketUsers, 'id');
  return {
    ...state,
    [investmentPatch.market_id]: newMarketUsers,
  };
}



function doAddMarketPresence(state, action) {
  const { marketId, user } = action;
  const oldUsers = state[marketId] || [];
  const newUsers = _.unionBy([{ ...user, fromQuickAdd: true }], oldUsers, 'id');
  return {
    ...state,
    [marketId]: newUsers,
  };
}

function doAddMarketPresences(state, action) {
  const { marketId, users } = action;
  const oldUsers = state[marketId] || [];
  const transformedUsers = users.map((user) => {
    return { ...user, fromQuickAdd: true };
  });
  const newUsers = _.unionBy(transformedUsers, oldUsers, 'id');
  return {
    ...state,
    [marketId]: newUsers,
  };
}

function doUpdateMarketPresences(state, action) {
  const { marketId, users } = action;
  const oldUsersRaw = state[marketId] || [];
  const oldUsers = oldUsersRaw.filter((user) => user.fromQuickAdd);
  // Avoid clobbering presences that were quick added
  const newUsers = addByIdAndVersion(users, oldUsers);
  return {
    ...removeInitializing(state, false),
    [marketId]: newUsers,
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
