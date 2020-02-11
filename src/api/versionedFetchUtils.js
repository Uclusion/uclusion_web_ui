import _ from 'lodash';
import { pushMessage } from '../utils/MessageBusUtils';
import { getVersions } from './summaries';
import { getMarketDetails, getMarketStages, getMarketUsers } from './markets';
import { getFetchSignaturesForMarket, signatureMatcher } from './versionSignatureUtils';
import {
  PUSH_COMMENTS_CHANNEL,
  PUSH_CONTEXT_CHANNEL, PUSH_INVESTIBLES_CHANNEL, PUSH_PRESENCE_CHANNEL, PUSH_STAGE_CHANNEL,
  VERSIONS_EVENT
} from '../contexts/VersionsContext/versionsContextHelper';
import { fetchComments } from './comments';
import { fetchInvestibles } from './marketInvestibles';
import { AllSequentialMap } from '../utils/PromiseUtils';
import { startTimerChain } from '../utils/timerUtils';
import { VERSIONS_HUB_CHANNEL } from '../contexts/WebSocketContext';
import { GLOBAL_VERSION_UPDATE } from '../contexts/VersionsContext/versionsContextMessages';

const MAX_RETRIES = 10;

export function refreshGlobalVersion(currentHeldVersion, existingMarkets) {
  let timeoutClearer;
  const execFunction = () => {
    return doVersionRefresh(currentHeldVersion, existingMarkets)
      .then((globalVersion) => {
        timeoutClearer();
        pushMessage(VERSIONS_HUB_CHANNEL, {event: GLOBAL_VERSION_UPDATE, globalVersion});
      });
  };
  timeoutClearer = startTimerChain(6000, MAX_RETRIES, execFunction);
}

function doVersionRefresh(currentHeldVersion, existingMarkets) {
  let newGlobalVersion;
  return getVersions()
    .then((versions) => {
      const { global_version, signatures: marketSignatures } = versions;
      newGlobalVersion = global_version;
      return AllSequentialMap(marketSignatures, (marketSignature) => {
        const { market_id: marketId, signatures: componentSignatures } = marketSignature;
        const promises = doRefreshMarket(marketId, componentSignatures);
          if (!existingMarkets.includes(marketId)) {
              promises.push(getMarketStages(marketId)
                .then((stages) => {
                  return pushMessage(PUSH_STAGE_CHANNEL, {event: VERSIONS_EVENT, marketId, stages})
                }));
            }
          return Promise.all(promises);
      });
    })
    .then(() => {
      return newGlobalVersion;
    });
}


function doRefreshMarket(marketId, componentSignatures) {
  const fetchSignatures = getFetchSignaturesForMarket(componentSignatures);
  const { market, comments, marketPresences, investibles } = fetchSignatures;
  const promises = [];
  if (!_.isEmpty(market)) {
    promises.push(fetchMarketVersion(marketId, market[0])) // can only be one market object per market:)
  }
  if (!_.isEmpty(comments)) {
    promises.push(fetchMarketComments(marketId, comments));
  }
  if (!_.isEmpty(investibles)) {
    promises.push(fetchMarketInvestibles(marketId, investibles));
  }
  if (!_.isEmpty(marketPresences)) {
    promises.push(fetchMarketPresences(marketId, marketPresences));
  }
  return promises;
}

function fetchMarketVersion(marketId, marketSignature) {
  return getMarketDetails(marketId)
    .then((marketDetails) => {
      const match = signatureMatcher([marketDetails], [marketSignature]);
      // we bothered to fetch the data, so we should use it:)
      pushMessage(PUSH_CONTEXT_CHANNEL, {event: VERSIONS_EVENT, marketDetails});
      if (!match.allMatched) {
        throw new Error("Market didn't match");
      }
    });
}

function fetchMarketComments(marketId, commentsSignatures) {
  const commentIds = commentsSignatures.map((comment) => comment.id);
  return fetchComments(commentIds, marketId)
    .then((comments) => {
      const match = signatureMatcher(comments, commentsSignatures);
      pushMessage(PUSH_COMMENTS_CHANNEL, {event: VERSIONS_EVENT, marketId, comments});
      if (!match.allMatched) {
        throw new Error("Comments didn't match");
      }
    });
}

function fetchMarketInvestibles(marketId, investiblesSignatures) {
  const investibleIds = investiblesSignatures.map((inv) => inv.investible.id);
  return fetchInvestibles(investibleIds, marketId)
    .then((investibles) => {
      const match = signatureMatcher(investibles, investiblesSignatures);
      pushMessage(PUSH_INVESTIBLES_CHANNEL, {event: VERSIONS_EVENT, marketId, investibles});
      if (!match.allMatched) {
        throw new Error("Investibles didn't match");
      }
    });
}

function fetchMarketPresences(marketId, mpSignatures) {
  return getMarketUsers(marketId)
    .then((users) => {
      const match = signatureMatcher(users, mpSignatures);
      pushMessage(PUSH_PRESENCE_CHANNEL, {event: VERSIONS_EVENT, marketId, users});
      if (!match.allMatched) {
        throw new Error("Presences didn't match");
      }
    });
}