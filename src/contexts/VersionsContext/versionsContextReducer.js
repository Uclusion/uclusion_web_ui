import { refreshNotificationVersion, } from './versionsContextHelper'
import LocalForageHelper from '../../utils/LocalForageHelper'
import { Auth } from 'aws-amplify';
export const VERSIONS_CONTEXT_NAMESPACE = 'versions_context';
export const EMPTY_GLOBAL_VERSION = 'FAKE';
export const INITIALIZATION_GLOBAL_VERSION = 'INITIALIZATION';
export const EMPTY_STATE = {
  globalVersion: EMPTY_GLOBAL_VERSION,
  notificationVersion: {version: -1 },
};
export const MY_STORED_EMPTY_STATE = {
  globalVersion: INITIALIZATION_GLOBAL_VERSION,
  notificationVersion: {version: -1 },
};


const UPDATE_GLOBAL_VERSION = 'UPDATE_GLOBAL_VERSION';
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

export function refreshNotificationVersionAction(message) {
  return {
    type: REFRESH_NOTIFICATION,
    message,
  };
}

/* Functions that mutate the state */

function removeStoredMarket(state, action) {
  const { marketId } = action;
  const { marketVersions } = state;
  const newMarketVersions = marketVersions.filter((market) => (market.marketId !== marketId));
  return {
    ...state,
    marketVersions: newMarketVersions,
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
    case REMOVE_MARKET:
      newState = removeStoredMarket(state, action);
      break;
    case REFRESH_NOTIFICATION:
      const { message } = action;
      newState = refreshNotificationVersion(state, message);
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
  const { globalVersion } = newState;
  if (globalVersion && globalVersion !== 'FAKE' && globalVersion !== 'INITIALIZATION') {
    // If logged in, do not store anything but a real global version to the disk,
    Auth.currentAuthenticatedUser()
      .then(() => {
        const lfh = new LocalForageHelper(VERSIONS_CONTEXT_NAMESPACE);
        return lfh.setState(newState);
      })
      // if you catch, we have no user, so just forget about it since we don't use the ram state for global versions checks
      .catch(() => {}); // do nothing, we don't want to store
  }
  return newState;
}

export default reducer;
