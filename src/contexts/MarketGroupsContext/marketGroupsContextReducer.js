import LocalForageHelper from '../../utils/LocalForageHelper'
import {MARKET_GROUPS_CONTEXT_NAMESPACE, GROUPS_CHANNEL} from './MarketGroupsContext';
import { removeInitializing } from '../../components/localStorageUtils'
import { BroadcastChannel } from 'broadcast-channel'
import { broadcastId } from '../../components/ContextHacks/BroadcastIdProvider'
import _ from 'lodash'
import { addByIdAndVersion } from '../ContextUtils';
import { syncMarketList } from '../../components/ContextHacks/ForceMarketSyncProvider';

const INITIALIZE_STATE = 'INITIALIZE_STATE';
const UPDATE_MARKET_GROUPS = 'UPDATE_MARKET_GROUPS';
const REMOVE_MARKET_GROUPS = 'REMOVE_MARKET_GROUPS';
const UPDATE_MARKET_GROUPS_FROM_NETWORK = 'UPDATE_MARKET_GROUPS_FROM_NETWORK';

/** Messages we can send the reducer **/

export function initializeState(newState) {
  return {
    type: INITIALIZE_STATE,
    newState,
  };
}

export function updateMarketGroups(marketId, groupsList) {
  return {
    type: UPDATE_MARKET_GROUPS,
    marketId,
    groupsList,
  };
}

export function updateMarketGroupsFromNetwork(groupDetails) {
  return {
    type: UPDATE_MARKET_GROUPS_FROM_NETWORK,
    groupDetails
  };
}

export function removeMarketsGroupsDetails(marketIds) {
  return {
    type: REMOVE_MARKET_GROUPS,
    marketIds,
  };
}

/** Functions that generate the new state **/

function doUpdateMarketGroups(state, action) {
  const { marketId, groupsList } = action;
  syncMarketList.push(marketId);
  const oldGroups = state[marketId] || [];
  const newGroups = _.unionBy(groupsList, oldGroups, 'id');
  return {
    ...removeInitializing(state),
    [marketId]: newGroups,
  };
}

function doUpdateMarketsGroups(state, action) {
  const { groupDetails } = action;
  const newState = {...state};
  Object.keys(groupDetails).forEach((marketId) => {
    newState[marketId] = addByIdAndVersion(groupDetails[marketId], newState[marketId]);
  });
  return removeInitializing(newState);
}

function computeNewState(state, action) {
  switch (action.type) {
    case INITIALIZE_STATE:
      return action.newState;
    case UPDATE_MARKET_GROUPS:
      return doUpdateMarketGroups(state, action);
    case UPDATE_MARKET_GROUPS_FROM_NETWORK:
      return doUpdateMarketsGroups(state, action);
    default:
      return state;
  }
}

let marketGroupsStoragePromiseChain = Promise.resolve(true);

function reducer(state, action) {
  const newState = computeNewState(state, action);
  if (action.type !== INITIALIZE_STATE) {
    const lfh = new LocalForageHelper(MARKET_GROUPS_CONTEXT_NAMESPACE);
    marketGroupsStoragePromiseChain = marketGroupsStoragePromiseChain.then(() => {
      lfh.setState(newState).then(() => {
        const myChannel = new BroadcastChannel(GROUPS_CHANNEL);
        return myChannel.postMessage(broadcastId || 'stages').then(() => myChannel.close())
          .then(() => console.info('Update groups context sent.'));
      });
    });
  }
  return newState;
}

export default reducer;
