import { pushMessage } from '../../utils/MessageBusUtils'
import { refreshGlobalVersion } from '../../api/versionedFetchUtils'
import { NOTIFICATION_MESSAGE_EVENT, VERSIONS_HUB_CHANNEL } from '../WebSocketContext'
import { getMessages } from '../../api/sso'
import _ from 'lodash'
import { EMPTY_GLOBAL_VERSION, INITIALIZATION_GLOBAL_VERSION } from './versionsContextReducer'

export const NOTIFICATIONS_HUB_CHANNEL = 'NotificationsChannel';
export const PUSH_HOME_USER_CHANNEL = 'HomeUserChannel';
export const PUSH_MARKETS_CHANNEL = 'MarketsChannel';
export const PUSH_COMMENTS_CHANNEL = 'CommentsChannel';
export const PUSH_INVESTIBLES_CHANNEL = 'InvestiblesChannel';
export const PUSH_PRESENCE_CHANNEL = 'PresenceChannel';
// Channel used when you're banned. We purge your stuff from the local store if you are.
export const REMOVED_MARKETS_CHANNEL = 'RemovedMarketsChannel';
export const PUSH_STAGE_CHANNEL = 'MarketsStagesChannel';
export const VERSIONS_EVENT = 'version_push';
export const BANNED_LIST = 'banned_list';

export function getGlobalVersion (state) {
  return state.globalVersion
}

// The user has to exist so if this function returns false the initial sync is still in progress
export function hasInitializedGlobalVersion (state) {
  const globalVersion = getGlobalVersion(state || {})
  return globalVersion && globalVersion !== EMPTY_GLOBAL_VERSION && globalVersion !== INITIALIZATION_GLOBAL_VERSION
}

export function hasLoadedNotificationsVersion(state) {
  return (state || {}).notificationVersion > -1;
}

export function hasLoadedGlobalVersion (state) {
  const globalVersion = getGlobalVersion(state || {})
  return globalVersion && globalVersion !== EMPTY_GLOBAL_VERSION
}

export function getExistingMarkets (state) {
  return state.existingMarkets || []
}

export function refreshVersions (ignoreIfInProgress=false) {
  return refreshGlobalVersion(ignoreIfInProgress)
}

export function refreshNotifications () {
  // tell versions to go and check if new notifications
  pushMessage(VERSIONS_HUB_CHANNEL, { event: NOTIFICATION_MESSAGE_EVENT });
}

// used by the reducer to actually process the new event
export function refreshNotificationVersion (state, auditRow) {
  const { notificationVersion } = state;
  const { version: newNotificationVersionNumber, hkey, rkey, is_remove: isRemove } = auditRow || {};
  //console.debug(`Refreshing notifications from ${notificationVersion} to ${newNotificationVersionNumber} with ${hkey}, ${rkey}, ${isRemove}`);
  if (newNotificationVersionNumber !== undefined && notificationVersion !== newNotificationVersionNumber) {
    getMessages().then((messages) => {
      const latest = (messages || []).find((message) => (message.type_object_id === rkey
        && message.market_id_user_id === hkey));
      if (isRemove === _.isEmpty(latest)) {
        //console.debug(`Updating with ${JSON.stringify(messages)}`);
        // Messages are reading from an index so can't consistent read.
        // So if retrieved stale then just ignore and hope to get updated later.
        pushMessage(NOTIFICATIONS_HUB_CHANNEL, { event: VERSIONS_EVENT, messages });
      }
    });
  }
  if (notificationVersion !== undefined && newNotificationVersionNumber === notificationVersion) {
    return state;
  }
  return {
    ...state,
    notificationVersion: newNotificationVersionNumber === undefined ? 0 : newNotificationVersionNumber
  };
}

