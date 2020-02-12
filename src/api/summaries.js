import uclusion from 'uclusion_sdk';
import AmpifyIdentitySource from '../authorization/AmplifyIdentityTokenRefresher';
import config from '../config';
import { notifyNewApplicationVersion } from '../contexts/WebSocketContext';

function getSummaryInfo() {
  return new AmpifyIdentitySource().getIdentity()
    .then((idToken) => uclusion.constructSummariesClient(config.api_configuration)
      .then((summaryClient) => ({ summaryClient, idToken })));
}

export function getVersions(currentVersion) {
  return getSummaryInfo()
    .then((summaryInfo) => {
      const { summaryClient, idToken } = summaryInfo;
      return summaryClient.versions(idToken, currentVersion);
    });
}

export function getNotifications() {
  return getSummaryInfo()
    .then((summaryInfo) => {
      const { summaryClient, idToken } = summaryInfo;
      return summaryClient.notifications(idToken)
        .then((notifications) => {
          // TODO we have app verion here, which is odd, but we'll move it later
          // For now notify here, and just pass it all along unmodified
          const appAuditVersion = notifications.find((versionRow) => versionRow.type_object_id === 'app_version');
          if (appAuditVersion) {
            const { app_version: appVersion, requires_cache_clear: cacheClear } = appAuditVersion;
            notifyNewApplicationVersion(appVersion, cacheClear);
          }
          return notifications;
        });
    });
}