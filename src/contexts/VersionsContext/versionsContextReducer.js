import {
  refreshMarketVersion,
  refreshNotificationVersion,
  refreshVersions,
  removeMarketVersion
} from './versionsContextHelper';
import LocalForageHelper from '../LocalForageHelper';

export function refreshVersionsAction(versions) {
  return {
    type: 'UPDATE_VERSIONS',
    versions,
  };
}

export function removeMarketVersionAction(marketId) {
  return {
    type: 'REMOVE_MARKET',
    marketId,
  };
}

export function refreshMarketVersionAction(message) {
  return {
    type: 'REFRESH_MARKET',
    message,
  };
}

export function refreshNotificationVersionAction(message) {
  return {
    type: 'REFRESH_NOTIFICATION',
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

function refreshStoredMarket(state, version) {
  const { marketVersions } = state;
  // eslint-disable-next-line max-len
  const existingMarketVersions = marketVersions.filter((market) => (market.marketId !== version.marketId));
  return {
    ...state,
    marketVersions: { existingMarketVersions, version },
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
    case 'UPDATE_VERSIONS': {
      const { versions } = action;
      const { marketVersions, notificationVersion } = versions;
      refreshVersions(state, marketVersions, notificationVersion);
      newState = updateStoredVersions(state, marketVersions, notificationVersion);
      break;
    }
    case 'REMOVE_MARKET': {
      const { marketId } = action;
      removeMarketVersion(marketId);
      newState = removeStoredMarket(state, marketId);
      break;
    }
    case 'REFRESH_MARKET': {
      const { message } = action;
      refreshMarketVersion(state, message);
      newState = refreshStoredMarket(state, message);
      break;
    }
    case 'REFRESH_NOTIFICATION': {
      const { message } = action;
      refreshNotificationVersion(state, message);
      newState = refreshStoredNotification(state, message);
      break;
    }
    default:
      newState = state;
  }
  const lfh = new LocalForageHelper(VERSIONS_CONTEXT_NAMESPACE);
  lfh.setState(newState);
  return newState;
}

export default reducer;
