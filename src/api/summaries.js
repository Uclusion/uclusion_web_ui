import uclusion from 'uclusion_sdk'
import AmpifyIdentitySource from '../authorization/AmplifyIdentityTokenRefresher'
import config from '../config'
import _ from 'lodash'
import { notifyNewApplicationVersion } from '../contexts/WebSocketContext'
import { AllSequentialMap } from '../utils/PromiseUtils'

function getSummaryInfo () {
  return new AmpifyIdentitySource().getIdentity()
    .then((idToken) => uclusion.constructSummariesClient(config.api_configuration)
      .then((summaryClient) => ({ summaryClient, idToken })))
}

export function getChangedIds(currentVersion) {
  return getSummaryInfo()
    .then((summaryInfo) => {
      const { summaryClient, idToken } = summaryInfo
      return summaryClient.idList(idToken, currentVersion)
    })
}

const MAX_MAREKTS_TO_FETCH_FROM_BACKEND = 15;

export function getVersions(idList) {
  const chunks = _.chunk(idList, MAX_MAREKTS_TO_FETCH_FROM_BACKEND)
  return getSummaryInfo()
    .then((summaryInfo) => {
      const { summaryClient, idToken } = summaryInfo
      return AllSequentialMap(chunks, (idList) => {
        //console.error("signleChunk");
        //console.error(idList);
        return summaryClient.versions(idToken, idList);
        //console.error(chunkversions);
        //return chunkversions;
      })
        .then((versionsList) => {
         // console.error("Combined versions");
         // console.error(versionsList);
          return versionsList.reduce((acc, chunk) => {
            return [...acc, ...chunk.signatures];
          }, []);
        })
    })
}

export function getNotifications () {
  return getSummaryInfo()
    .then((summaryInfo) => {
      const { summaryClient, idToken } = summaryInfo
      return summaryClient.notifications(idToken)
        .then((notifications) => {
          // TODO we have app verion here, which is odd, but we'll move it later
          // For now notify here, and just pass it all along unmodified
          const appAuditVersion = notifications.find((versionRow) => versionRow.type_object_id === 'app_version')
          if (appAuditVersion) {
            const { app_version: appVersion, cache_clear_version: cacheClearVersion } = appAuditVersion
            notifyNewApplicationVersion(appVersion, cacheClearVersion)
          }
          return notifications
        })
    })
}