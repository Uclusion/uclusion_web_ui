import {
  refreshNotificationVersion,
} from './versionsContextHelper';
import LocalForageHelper from '../LocalForageHelper';

export const EMPTY_STATE = {
  globalVersion: '',
  existingMarkets: '',
};

const LOADING_STATE = {
  marketVersions: [],
  notificationVersion: { version: -1 },
};

const UPDATE_GLOBAL_VERSION = 'UPDATE_GLOBAL_VERSION';
const UPDATE_EXISTING_MARKETS = 'UPDATE_EXISTING_MARKETS';
const INITIALIZE_STATE = 'INITIALIZE_STATE';
const INITIALIZE_LOADING = 'INITIALIZE_LOADING';
const REMOVE_MARKET = 'REMOVE_MARKET';
const REFRESH_NOTIFICATION = 'REFRESH_NOTIFICATION';
const INITIALIZE_STATE_VERSIONS = 'INITIALIZE_STATE_VERSIONS';

export function updateGlobalVersion(globalVersion) {
  return {
    type: UPDATE_GLOBAL_VERSION,
    globalVersion,
  };
}

export function initializeVersionsAction(diskState) {
  return {
    type: INITIALIZE_STATE_VERSIONS,
    diskState,
  };
}

export function initializeState() {
  return {
    type: INITIALIZE_STATE,
  };
}

export function loadingState() {
  return {
    type: INITIALIZE_LOADING,
  };
}

export function removeMarketVersionAction(marketId) {
  return {
    type: REMOVE_MARKET,
    marketId,
  };
}

export function refreshNotificationVersionAction(message) {
  return {
    type: REFRESH_NOTIFICATION,
    message,
  };
}

/* Functions that mutate the state */

function updateStoredVersions(state, marketVersions, notificationVersion) {
  return {
    marketVersions,
    notificationVersion,
  };
}

function removeStoredMarket(state, marketId) {
  const { marketVersions } = state;
  const newMarketVersions = marketVersions.filter((market) => (market.marketId !== marketId));
  return {
    ...state,
    marketVersions: newMarketVersions,
  };
}


function refreshStoredNotification(state, version) {
  return {
    ...state,
    notificationVersion: version,
  };
}

export const VERSIONS_CONTEXT_NAMESPACE = 'versions_context';

function reducer(state, action) {
  let newState;
  switch (action.type) {
    case UPDATE_GLOBAL_VERSION:
      newState = {
        ...state,
        globalVersion: action.globalVersion,
      };
      break;
    case REMOVE_MARKET:
      const { marketId } = action;
      newState = removeStoredMarket(state, marketId);
      break;
    case REFRESH_NOTIFICATION:
      const { message } = action;
      refreshNotificationVersion(state, message);
      newState = refreshStoredNotification(state, message);
      break;
    case INITIALIZE_STATE_VERSIONS:
      const { diskState } = action;
      newState = diskState || EMPTY_STATE;
      break;
    case INITIALIZE_STATE:
      newState = EMPTY_STATE;
      break;
    default:
      newState = state;
  }
  const lfh = new LocalForageHelper(VERSIONS_CONTEXT_NAMESPACE);
  lfh.setState(newState);
  return newState;
}

export default reducer;
