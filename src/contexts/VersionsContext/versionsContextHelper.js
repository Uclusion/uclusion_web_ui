import { pushMessage } from '../../utils/MessageBusUtils';
import { refreshGlobalVersion } from '../../api/versionedFetchUtils';
import { NOTIFICATION_MESSAGE_EVENT, VERSIONS_HUB_CHANNEL } from '../WebSocketContext';
import { addVersionRequirement } from './versionsContextReducer';

export const NOTIFICATIONS_HUB_CHANNEL = 'NotificationsChannel';
export const PUSH_CONTEXT_CHANNEL = 'MarketsChannel';
export const PUSH_COMMENTS_CHANNEL = 'CommentsChannel';
export const PUSH_INVESTIBLES_CHANNEL = 'InvestiblesChannel';
export const PUSH_PRESENCE_CHANNEL = 'PresenceChannel';
export const REMOVED_MARKETS_CHANNEL = 'RemovedMarketsChannel';
export const PUSH_STAGE_CHANNEL = 'MarketsStagesChannel';
export const VERSIONS_EVENT = 'version_push';
export const BANNED_LIST = 'banned_list';

export function getGlobalVersion (state) {
  return state.globalVersion;
}

export function getExistingMarkets (state) {
  return state.existingMarkets || [];
}

export function refreshVersions () {
  return refreshGlobalVersion();
}

export function refreshNotifications () {
  // tell versions to go and check if new notifications
  pushMessage(VERSIONS_HUB_CHANNEL, { event: NOTIFICATION_MESSAGE_EVENT });
}

// used by the reducer to actually process the new event
export function refreshNotificationVersion (state, version) {
  const { notificationVersion } = state;
  processNewNotification(version, notificationVersion);
}

function processNewNotification (newNotificationVersion, notificationVersion) {
  const { version: notificationVersionNumber } = notificationVersion || {};
  const { version: newNotificationVersionNumber, hkey, rkey } = newNotificationVersion || {};
  // console.debug(`Refreshing notifications from ${notificationVersionNumber} to ${newNotificationVersionNumber}`);
  if (notificationVersionNumber !== newNotificationVersionNumber) {
    pushMessage(NOTIFICATIONS_HUB_CHANNEL, { event: VERSIONS_EVENT, hkey, rkey });
  }
}

/**
 * Adds a versions requirment to the global fetch system. That is,
 * we'll ingore any global version that does not satisfy this requirement
 * @param requirement
 */
export function addMinimumVersionRequirement (dispatch, requirement) {
  dispatch(addVersionRequirement(requirement));
}
