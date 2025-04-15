import { removeInitializing } from '../../components/localStorageUtils'
import _ from 'lodash'
import { addByIdAndVersion } from '../ContextUtils';
import { leaderContextHack } from '../LeaderContext/LeaderContext';
import LocalForageHelper from '../../utils/LocalForageHelper';
import { MARKET_GROUPS_CONTEXT_NAMESPACE } from './MarketGroupsContext';

const INITIALIZE_STATE = 'INITIALIZE_STATE';
const UPDATE_MARKET_GROUPS = 'UPDATE_MARKET_GROUPS';
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

/** Functions that generate the new state **/

function doUpdateMarketGroups(state, action) {
  const { marketId, groupsList } = action;
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
    const { isLeader } = leaderContextHack;
    if (isLeader) {
      const lfh = new LocalForageHelper(MARKET_GROUPS_CONTEXT_NAMESPACE);
      marketGroupsStoragePromiseChain = marketGroupsStoragePromiseChain.then(() => {
        return lfh.setState(newState).then(() => {
          console.info('Updated groups context storage.');
        })
      });
    }
  }
  return newState;
}

export default reducer;
