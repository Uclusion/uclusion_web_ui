import uclusion from 'uclusion_sdk';
import _ from 'lodash';
import AmpifyIdentitySource from '../authorization/AmplifyIdentityTokenRefresher';
import config from '../config';


function getSummaryInfo() {
  return new AmpifyIdentitySource().getIdentity()
    .then((idToken) => uclusion.constructSummariesClient(config.api_configuration)
      .then((summaryClient) => ({ summaryClient, idToken })));
}

export function getVersions() {
  return getSummaryInfo()
    .then((summaryInfo) => {
      const { summaryClient, idToken } = summaryInfo;
      // as a side effect, whenever we get the active market list, we'll update the
      // authorization tokens contained inside, since it's free
      return summaryClient.versions(idToken)
        .then((versions) => {
          const marketVersions = _.remove(versions, (versionRow) => versionRow.type_object_id.includes('market'));
          const notificationVersion = versions.length > 0 ? versions[0] : {};
          return { marketVersions, notificationVersion };
        });
    });
}
