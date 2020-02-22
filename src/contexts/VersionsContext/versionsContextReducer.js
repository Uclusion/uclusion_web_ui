import {
  refreshNotificationVersion,
} from './versionsContextHelper';
import LocalForageHelper from '../LocalForageHelper';

export const VERSIONS_CONTEXT_NAMESPACE = 'versions_context';
export const EMPTY_STATE = {
  globalVersion: 'FAKE',
  existingMarkets: '',
  notificationVersion: {version: -1 },
};
export const MY_STORED_EMPTY_STATE = {
  globalVersion: '',
  existingMarkets: '',
  notificationVersion: {version: -1 },
};


const UPDATE_GLOBAL_VERSION = 'UPDATE_GLOBAL_VERSION';
const NEW_MARKET = 'NEW_MARKET';
const INITIALIZE_STATE = 'INITIALIZE_STATE';
const INITIALIZE_LOADING = 'INITIALIZE_LOADING';
const REMOVE_MARKET = 'REMOVE_MARKET';
const REFRESH_NOTIFICATION = 'REFRESH_NOTIFICATION';
const INITIALIZE_STATE_VERSIONS = 'INITIALIZE_STATE_VERSIONS';


export function addNewMarket(marketId) {
  return {
    type: NEW_MARKET,
    marketId,
  }
}

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

export function refreshNotificationVersionAction(message) {
  return {
    type: REFRESH_NOTIFICATION,
    message,
  };
}

/* Functions that mutate the state */

function doAddNewMarket(state, action) {
  const { marketId } = action;
  const { existingMarkets } = state;
  if (!existingMarkets) {
    return {
      ...state,
      existingMarkets: [marketId],
    };
  }
  const newMarkets = [
    ...existingMarkets,
    marketId,
  ];
  return {
    ...state,
    existingMarkets: newMarkets,
  };
}



function removeStoredMarket(state, action) {
  const { marketId } = action;
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

function reducer(state, action) {
  let newState;
  switch (action.type) {
    case UPDATE_GLOBAL_VERSION:
      newState = {
        ...state,
        globalVersion: action.globalVersion,
      };
      break;
    case NEW_MARKET:
      newState = doAddNewMarket(state, action);
      break;
    case REMOVE_MARKET:
      newState = removeStoredMarket(state, action);
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
