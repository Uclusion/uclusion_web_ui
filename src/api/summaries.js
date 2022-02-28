import uclusion from 'uclusion_sdk'
import config from '../config'
import _ from 'lodash'
import { notifyNewApplicationVersion } from '../contexts/WebSocketContext'
import { AllSequentialMap } from '../utils/PromiseUtils'
import { getAccountSSOClient } from './uclusionClient';

function getSummaryInfo () {
  return getAccountSSOClient()
    .then((ssoInfo) => {
      const { accountToken } = ssoInfo;
      return uclusion.constructSummariesClient(config.api_configuration)
        .then((summaryClient) => ({ summaryClient, accountToken }))
    })
}

export function getChangedIds(currentVersion) {
  return getSummaryInfo()
    .then((summaryInfo) => {
      const { summaryClient, accountToken } = summaryInfo
      return summaryClient.idList(accountToken, currentVersion)
    })
}

const MAX_MARKETS_TO_FETCH_FROM_BACKEND = 15;
const MAX_INLINE_MARKETS_TO_FETCH_FROM_BACKEND = 50;

export function getVersions(idList, isInline=false) {
  const chunkSize = isInline ? MAX_INLINE_MARKETS_TO_FETCH_FROM_BACKEND : MAX_MARKETS_TO_FETCH_FROM_BACKEND;
  const chunks = _.chunk(idList, chunkSize)
  return getSummaryInfo()
    .then((summaryInfo) => {
      const { summaryClient, accountToken } = summaryInfo
      return AllSequentialMap(chunks, (idList) => {
        //console.error("signleChunk");
        //console.error(idList);
        return summaryClient.versions(accountToken, idList);
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
      const { summaryClient, accountToken } = summaryInfo
      return summaryClient.notifications(accountToken)
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