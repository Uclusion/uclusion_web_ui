import _ from 'lodash';
import { pushMessage } from '../utils/MessageBusUtils';
import { getVersions } from './summaries';
import { getMarketDetails, getMarketStages, getMarketUsers } from './markets';
import { getFetchSignaturesForMarket, signatureMatcher, getRemoveListForMarket } from './versionSignatureUtils';
import {
  PUSH_COMMENTS_CHANNEL,
  PUSH_CONTEXT_CHANNEL, PUSH_INVESTIBLES_CHANNEL, PUSH_PRESENCE_CHANNEL, PUSH_STAGE_CHANNEL,
  VERSIONS_EVENT
} from '../contexts/VersionsContext/versionsContextHelper';
import { fetchComments } from './comments';
import { fetchInvestibles } from './marketInvestibles';
import { AllSequentialMap } from '../utils/PromiseUtils';
import { startTimerChain } from '../utils/timerUtils';
import { MARKET_MESSAGE_EVENT, VERSIONS_HUB_CHANNEL } from '../contexts/WebSocketContext';
import { GLOBAL_VERSION_UPDATE, NEW_MARKET } from '../contexts/VersionsContext/versionsContextMessages';
import { REMOVE_INVESTIBLES } from '../contexts/InvestibesContext/investiblesContextMessages'

const MAX_RETRIES = 10;

export class MatchError extends Error {

}

/**
 *  Refreshes the global version swith retry. Does _not_ return a promise.
 *  Use if you want to fire and forget.
 * @param currentHeldVersion
 * @param existingMarkets
 */
export function refreshGlobalVersion(currentHeldVersion, existingMarkets) {
  let timeoutClearer;
  const execFunction = () => {
    return doVersionRefresh(currentHeldVersion, existingMarkets)
      .then((globalVersion) => {
        console.log(`My new global version ${globalVersion}`);
        timeoutClearer();
        if(globalVersion !== currentHeldVersion) {
          pushMessage(VERSIONS_HUB_CHANNEL, { event: GLOBAL_VERSION_UPDATE, globalVersion });
        }
      }).catch((error) => {
        // we'll log match problems, but raise the rest
        if (error instanceof MatchError) {
          console.error(error.message);
        } else {
          throw error;
        }
      })
  };
  timeoutClearer = startTimerChain(6000, MAX_RETRIES, execFunction);
}

/**
 * Function that will make exactly one attempt to update the global versions
 * USed if you have some other control and want access to the promise chain
 * @param currentHeldVersion
 * @param existingMarkets
 * @returns {Promise<*>}
 */
export function doVersionRefresh(currentHeldVersion, existingMarkets) {
  let newGlobalVersion;
  return getVersions(currentHeldVersion)
    .then((versions) => {
      console.log("Version fetch");
      console.log(versions);
      const { global_version, signatures: marketSignatures } = versions;
      if (_.isEmpty(marketSignatures) || _.isEmpty(global_version) ) {
        return currentHeldVersion;
      }
      newGlobalVersion = global_version;
      return AllSequentialMap(marketSignatures, (marketSignature) => {
        const { market_id: marketId, signatures: componentSignatures } = marketSignature;
        console.log(componentSignatures);
        doPushRemovals(marketId, componentSignatures);
        const promises = doRefreshMarket(marketId, componentSignatures);
        if (!_.isEmpty(promises)) {
          // send a notification to the versions channel saying we have incoming stuff
          // for this market
          pushMessage(VERSIONS_HUB_CHANNEL, { event: MARKET_MESSAGE_EVENT, marketId });
        }
        if (!existingMarkets || !existingMarkets.includes(marketId)) {
          pushMessage(VERSIONS_HUB_CHANNEL, { event: NEW_MARKET, marketId });
          promises.push(getMarketStages(marketId)
            .then((stages) => {
              return pushMessage(PUSH_STAGE_CHANNEL, { event: VERSIONS_EVENT, marketId, stages });
            }));
        }
        return Promise.all(promises);
      });
    })
    .then(() => {
      return newGlobalVersion;
    });
}

function doPushRemovals(marketId, marketRemovalSignatures) {
  const { investibles } = getRemoveListForMarket(marketRemovalSignatures);
  if (!_.isEmpty(investibles)){
    console.log("Removal List");
    console.log(investibles);
    pushMessage(PUSH_INVESTIBLES_CHANNEL, { event: REMOVE_INVESTIBLES, marketId, investibles });
  }
}

function doRefreshMarket(marketId, componentSignatures) {
  const fetchSignatures = getFetchSignaturesForMarket(componentSignatures);
  console.log(fetchSignatures);
  const { markets, comments, marketPresences, investibles } = fetchSignatures;
  const promises = [];
  if (!_.isEmpty(markets)) {
    promises.push(fetchMarketVersion(marketId, markets[0])); // can only be one market object per market:)
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
      console.log(marketDetails);
      const match = signatureMatcher([marketDetails], [marketSignature]);
      // we bothered to fetch the data, so we should use it:)
      pushMessage(PUSH_CONTEXT_CHANNEL, { event: VERSIONS_EVENT, marketDetails });
      if (!match.allMatched) {
        throw new MatchError("Market didn't match");
      }
    });
}

function fetchMarketComments(marketId, commentsSignatures) {
  const commentIds = commentsSignatures.map((comment) => comment.id);
  return fetchComments(commentIds, marketId)
    .then((comments) => {
      const match = signatureMatcher(comments, commentsSignatures);
      pushMessage(PUSH_COMMENTS_CHANNEL, { event: VERSIONS_EVENT, marketId, comments });
      if (!match.allMatched) {
        throw new MatchError("Comments didn't match");
      }
    });
}

function fetchMarketInvestibles(marketId, investiblesSignatures) {
  const investibleIds = investiblesSignatures.map((inv) => inv.investible.id);
  return fetchInvestibles(investibleIds, marketId)
    .then((investibles) => {
      console.log("Fetching investibles");
      console.log(investibles);
      console.log(investiblesSignatures);
      const match = signatureMatcher(investibles, investiblesSignatures);
      pushMessage(PUSH_INVESTIBLES_CHANNEL, { event: VERSIONS_EVENT, marketId, investibles });
      if (!match.allMatched) {
        throw new MatchError("Investibles didn't match");
      }
    });
}

function fetchMarketPresences(marketId, mpSignatures) {
  return getMarketUsers(marketId)
    .then((users) => {
      console.log(users);
      const match = signatureMatcher(users, mpSignatures);
      console.log(mpSignatures);
      pushMessage(PUSH_PRESENCE_CHANNEL, { event: VERSIONS_EVENT, marketId, users });
      if (!match.allMatched) {
        throw new MatchError("Presences didn't match");
      }
    });
}