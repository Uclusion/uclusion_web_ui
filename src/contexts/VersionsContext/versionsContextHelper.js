import { pushMessage } from '../../utils/MessageBusUtils';
import { refreshGlobalVersion } from '../../api/versionedFetchUtils';

export const NOTIFICATIONS_HUB_CHANNEL = 'NotificationsChannel';
export const PUSH_CONTEXT_CHANNEL = 'MarketsChannel';
export const PUSH_COMMENTS_CHANNEL = 'CommentsChannel';
export const PUSH_INVESTIBLES_CHANNEL = 'InvestiblesChannel';
export const PUSH_PRESENCE_CHANNEL = 'PresenceChannel';
export const REMOVED_MARKETS_CHANNEL = 'RemovedMarketsChannel';
export const PUSH_STAGE_CHANNEL = 'MarketsStagesChannel';
export const VERSIONS_EVENT = 'version_push';


export function getGlobalVersion(state) {
  return state.globalVersion;
}

export function getExistingMarkets(state) {
  return state.existingMarkets || [];
}


function processNewNotification(newNotificationVersion, notificationVersion) {
  const { version: notificationVersionNumber } = notificationVersion;
  const { version: newNotificationVersionNumber } = newNotificationVersion;
  console.debug(`Refreshing notifications from ${notificationVersionNumber} to ${newNotificationVersionNumber}`);
  if (notificationVersionNumber !== newNotificationVersionNumber) {
    pushMessage(NOTIFICATIONS_HUB_CHANNEL, { event: VERSIONS_EVENT });
  }
}

export function refreshVersions(state) {
  console.debug('Refreshing versions');
  const {
    existingMarkets,
    globalVersion,
  } = state;
  return refreshGlobalVersion(globalVersion, existingMarkets);
}

export function refreshNotificationVersion(state, version) {
  const { notificationVersion } = state;
  processNewNotification(version, notificationVersion);
}



