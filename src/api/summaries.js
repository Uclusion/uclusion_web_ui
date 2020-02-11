import uclusion from 'uclusion_sdk';
import AmpifyIdentitySource from '../authorization/AmplifyIdentityTokenRefresher';
import config from '../config';

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
      return summaryClient.notifications(idToken);
    });
}