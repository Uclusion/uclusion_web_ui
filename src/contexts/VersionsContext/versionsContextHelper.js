import { Hub } from 'aws-amplify';
import _ from 'lodash';

export const NOTIFICATIONS_HUB_CHANNEL = 'NotificationsChannel';
export const PUSH_CONTEXT_CHANNEL = 'MarketsChannel';
export const PUSH_COMMENTS_CHANNEL = 'CommentsChannel';
export const PUSH_INVESTIBLES_CHANNEL = 'InvestiblesChannel';
export const PUSH_PRESENCE_CHANNEL = 'PresenceChannel';
export const REMOVED_MARKETS_CHANNEL = 'RemovedMarketsChannel';
export const PUSH_STAGE_CHANNEL = 'MarketsStagesChannel';
export const VERSIONS_EVENT = 'version_push';

function compareProcessSingleVersion(rawUpdatedMarket, rawOldMarket) {
  if (rawOldMarket) {
    const {
      market_info_version: marketInfoVersion,
      investibles_version: investiblesVersion,
      comments_version: commentsVersion,
      market_presence_version: marketPresenceVersion,
    } = rawOldMarket;
    const {
      market_info_version: newMarketInfoVersion,
      investibles_version: newInvestiblesVersion,
      comments_version: newCommentsVersion,
      market_presence_version: newMarketPresenceVersion,
    } = rawUpdatedMarket;
    return {
      marketId: rawUpdatedMarket.marketId,
      marketsInfoChange: marketInfoVersion !== newMarketInfoVersion,
      investiblesChange: investiblesVersion !== newInvestiblesVersion,
      commentsChange: commentsVersion !== newCommentsVersion,
      marketPresenceChange: marketPresenceVersion !== newMarketPresenceVersion,
      isNew: false,
    };
  }
  return {
    marketId: rawUpdatedMarket.marketId,
    marketsInfoChange: true,
    investiblesChange: true,
    commentsChange: true,
    marketPresenceChange: true,
    isNew: true,
  };
}

function processNewNotification(newNotificationVersion, notificationVersion) {
  const { version: notificationVersionNumber } = notificationVersion;
  const { version: newNotificationVersionNumber } = newNotificationVersion;
  if (notificationVersionNumber !== newNotificationVersionNumber) {
    Hub.dispatch(NOTIFICATIONS_HUB_CHANNEL, { event: VERSIONS_EVENT });
  }
}

export function refreshVersions(state, newMarketVersions, newNotificationVersion) {
 /* const { marketVersions, notificationVersion } = state;
  processNewNotification(newNotificationVersion, notificationVersion);
  // If you are on the left but not on the right by marketId then you were removed
  const rawRemovedMarketList = _.differenceBy(marketVersions, newMarketVersions, 'marketId');
  if (rawRemovedMarketList) {
    // eslint-disable-next-line max-len
    const removedMarketList = rawRemovedMarketList.map((rawRemovedMarket) => (rawRemovedMarket.marketId));
    Hub.dispatch(REMOVED_MARKETS_CHANNEL, { event: VERSIONS_EVENT, message: removedMarketList });
  }
  // If you are in the new but not the same in the old then you are updated or inserted
  const rawUpdatedMarketList = _.difference(newMarketVersions, marketVersions);
  const updatedMarketList = rawUpdatedMarketList.map((rawUpdatedMarket) => {
    // eslint-disable-next-line max-len
    const rawOldMarket = marketVersions.find((market) => (market.marketId === rawUpdatedMarket.marketId));
    return compareProcessSingleVersion(rawUpdatedMarket, rawOldMarket);
  });
  const marketsInfoChangesList = updatedMarketList.filter((market) => (market.marketsInfoChange));
  if (marketsInfoChangesList) {
    const marketList = marketsInfoChangesList.map((market) => (market.marketId));
    Hub.dispatch(PUSH_CONTEXT_CHANNEL, { event: VERSIONS_EVENT, message: marketList });
  }
  const investiblesChangesList = updatedMarketList.filter((market) => (market.investiblesChange));
  if (investiblesChangesList) {
    const marketList = investiblesChangesList.map((market) => (market.marketId));
    Hub.dispatch(PUSH_INVESTIBLES_CHANNEL, { event: VERSIONS_EVENT, message: marketList });
  }
  const commentsChangesList = updatedMarketList.filter((market) => (market.commentsChange));
  if (commentsChangesList) {
    const marketList = commentsChangesList.map((market) => (market.marketId));
    Hub.dispatch(PUSH_COMMENTS_CHANNEL, { event: VERSIONS_EVENT, message: marketList });
  }
  // eslint-disable-next-line max-len
  const marketPresencesChangesList = updatedMarketList.filter((market) => (market.marketPresenceChange));
  if (marketPresencesChangesList) {
    const marketList = marketPresencesChangesList.map((market) => (market.marketId));
    Hub.dispatch(PUSH_PRESENCE_CHANNEL, { event: VERSIONS_EVENT, message: marketList });
  }
  const marketAddedList = updatedMarketList.filter((market) => (market.isNew));
  if (marketAddedList) {
    const marketList = marketAddedList.map((market) => (market.marketId));
    Hub.dispatch(PUSH_STAGE_CHANNEL, { event: VERSIONS_EVENT, message: marketList });
  }
  */
}

export function refreshNotificationVersion(state, version) {
  const { notificationVersion } = state;
  processNewNotification(version, notificationVersion);
}

export function removeMarketVersion(marketId) {
  Hub.dispatch(REMOVED_MARKETS_CHANNEL, { event: VERSIONS_EVENT, message: [marketId] });
}

export function refreshMarketVersion(state, version) {
/*  const { marketVersions } = state;
  const previousVersion = marketVersions.find((market) => (market.marketId === version.marketId));
  const processedVersion = compareProcessSingleVersion(version, previousVersion);
  const marketList = [processedVersion.marketId];
  if (processedVersion.marketsInfoChange) {
    Hub.dispatch(PUSH_CONTEXT_CHANNEL, { event: VERSIONS_EVENT, message: marketList });
  }
  if (processedVersion.investiblesChange) {
    Hub.dispatch(PUSH_INVESTIBLES_CHANNEL, { event: VERSIONS_EVENT, message: marketList });
  }
  if (processedVersion.commentsChange) {
    Hub.dispatch(PUSH_COMMENTS_CHANNEL, { event: VERSIONS_EVENT, message: marketList });
  }
  if (processedVersion.marketPresenceChange) {
    Hub.dispatch(PUSH_PRESENCE_CHANNEL, { event: VERSIONS_EVENT, message: marketList });
  }

 */
}
