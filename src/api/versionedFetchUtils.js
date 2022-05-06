import _ from 'lodash'
import { pushMessage } from '../utils/MessageBusUtils'
import { getChangedIds, getVersions } from './summaries'
import { getMarketDetails, getMarketStages, getMarketUsers } from './markets'
import { getFetchSignaturesForMarket, signatureMatcher, } from './versionSignatureUtils'
import { fetchComments } from './comments'
import { fetchInvestibles } from './marketInvestibles'
import { LimitedParallelMap } from '../utils/PromiseUtils'
import { startTimerChain } from '../utils/timerUtils'
import { getHomeAccountUser } from './sso'
import { checkInStorage, checkSignatureInStorage } from './storageIntrospector'

const MAX_RETRIES = 10;
const MAX_CONCURRENT_API_CALLS = 5;
const MAX_CONCURRENT_ARCHIVE_API_CALLS = 1;
export const NOTIFICATIONS_HUB_CHANNEL = 'NotificationsChannel';
export const PUSH_HOME_USER_CHANNEL = 'HomeUserChannel';
export const PUSH_MARKETS_CHANNEL = 'MarketsChannel';
export const PUSH_COMMENTS_CHANNEL = 'CommentsChannel';
export const PUSH_INVESTIBLES_CHANNEL = 'InvestiblesChannel';
export const PUSH_PRESENCE_CHANNEL = 'PresenceChannel';
// Channel used when you're banned. We purge your stuff from the local store if you are.
export const REMOVED_MARKETS_CHANNEL = 'RemovedMarketsChannel';
export const PUSH_STAGE_CHANNEL = 'MarketsStagesChannel';
export const VERSIONS_EVENT = 'version_push';
export const BANNED_LIST = 'banned_list';

export class MatchError extends Error {

}

let globalFetchPromiseChain = Promise.resolve(true);
let globalFetchPromiseTracker = {inProgress: 0};

export function executeRefreshTimerChain(refreshAll, resolve, reject) {
  const execFunction = () => {
    return doVersionRefresh().then(() => {
        globalFetchPromiseTracker.inProgress -= 1;
        resolve(true);
        return Promise.resolve(true);
      }).catch((error) => {
        console.error(error);
        // we'll log match problems, but raise the rest
        if (error instanceof MatchError) {
          return false;
        } else {
          reject(error);
        }
      });
  };
  startTimerChain(6000, MAX_RETRIES, execFunction);
}

/**
 * Starts off a global refresh timer.
 * @returns {Promise<unknown>}
 */
function startGlobalRefreshTimerChain(refreshAll) {
  return new Promise((resolve, reject) => {
    executeRefreshTimerChain(refreshAll, resolve, reject);
  });
}

export function refreshVersions (ignoreIfInProgress=false) {
  return refreshGlobalVersion(ignoreIfInProgress)
}

export function refreshNotifications () {
  // check if new notifications
  pushMessage(NOTIFICATIONS_HUB_CHANNEL, { event: VERSIONS_EVENT });
}

/**
 * Refreshes the global version to consider the fetch complete.
 * At most need one running and one queued as each call does the same thing.
 * @returns {Promise<*>}
 */
export function refreshGlobalVersion(ignoreIfInProgress) {
  if (!globalFetchPromiseTracker) {
    console.warn('No fetch tracking');
    globalFetchPromiseTracker = {inProgress: 0};
  } else {
    console.info(globalFetchPromiseTracker);
  }
  const { inProgress } = globalFetchPromiseTracker;
  if (!globalFetchPromiseChain || inProgress < 1) {
    // Spec says you can call then multiple times but Chrome might have some limit so re-init
    globalFetchPromiseChain = Promise.resolve(true);
  }
  if (inProgress > 1) {
    return globalFetchPromiseChain;
  }
  if (inProgress > 0 && ignoreIfInProgress) {
    return globalFetchPromiseChain;
  }
  globalFetchPromiseTracker.inProgress += 1;
  // Always chain to avoid fetching the same version over and over
  globalFetchPromiseChain = globalFetchPromiseChain.then(() => {
    return startGlobalRefreshTimerChain();
  });
  return globalFetchPromiseChain;
}

/**
 * Updates all our markets from the passed in signatures
 * @param marketIds the market ids to fetch signatures for
 * @param marketsStruct for passing the gathered information
 * @param maxConcurrentCount the maximum number of api calls to make at once
 * @param isInline whether the markets are inline or not
 * @returns {Promise<*>}
 */
export function updateMarkets(marketIds, marketsStruct, maxConcurrentCount, isInline=false) {
  if (_.isEmpty(marketIds)) {
    return Promise.resolve(true);
  }
  return getVersions(marketIds, isInline)
    .then((marketSignatures) => {
      //console.error(marketSignatures);
      return LimitedParallelMap(marketSignatures, (marketSignature) => {
        //console.error("MarketSignature")
        //console.error(marketSignature);
        const { market_id: marketId, signatures: componentSignatures } = marketSignature;
        return doRefreshMarket(marketId, componentSignatures, marketsStruct);
      }, maxConcurrentCount);
    });
}

export function sendMarketsStruct(marketsStruct) {
  if (marketsStruct['markets']) {
    pushMessage(PUSH_MARKETS_CHANNEL, { event: VERSIONS_EVENT, marketDetails: marketsStruct['markets'] });
  }
  if (marketsStruct['comments']) {
    pushMessage(PUSH_COMMENTS_CHANNEL, { event: VERSIONS_EVENT, commentDetails: marketsStruct['comments'] });
  }
  if (marketsStruct['investibles']) {
    pushMessage(PUSH_INVESTIBLES_CHANNEL, { event: VERSIONS_EVENT, investibles: marketsStruct['investibles'] });
  }
  if (marketsStruct['users']) {
    pushMessage(PUSH_PRESENCE_CHANNEL, { event: VERSIONS_EVENT, userDetails: marketsStruct['users'] });
  }
  if (marketsStruct['stages']) {
    pushMessage(PUSH_STAGE_CHANNEL, { event: VERSIONS_EVENT, stageDetails: marketsStruct['stages'] });
  }
}

function addMarketsStructInfo(infoType, marketsStruct, details, marketId) {
  if (marketId) {
    if (!marketsStruct[infoType]) {
      marketsStruct[infoType] = {};
    }
    if (!marketsStruct[infoType][marketId]) {
      marketsStruct[infoType][marketId] = details;
    } else {
      marketsStruct[infoType][marketId] = marketsStruct[infoType][marketId].concat(details);
    }
  } else {
    if (!marketsStruct[infoType]) {
      marketsStruct[infoType] = [];
    }
    marketsStruct[infoType] = marketsStruct[infoType].concat(details);
  }
}

/**
 * Function that will make exactly one attempt to sync by adding to the promise chain
 * @returns {Promise<*>}
 */
export function doVersionRefresh() {
  console.info('Checking for sync');
  return getChangedIds().then((audits) => {
      const foregroundList = [];
      const backgroundList = [];
      const inlineList = [];
      const fullList = [];
      const checkSignaturePromises = (audits || []).map((audit) => {
        const { signature, inline, active, id } = audit;
        fullList.push(id);
        return checkSignatureInStorage(id, signature).then((hasSignature) => {
          if (!hasSignature) {
            if (inline) {
              inlineList.push(id);
            } else if (active) {
              foregroundList.push(id);
            } else {
              backgroundList.push(id);
            }
          }
        });
      });
      return Promise.all(checkSignaturePromises).then(() => {
        // use the full list to calculate market's we're banned from
        pushMessage(REMOVED_MARKETS_CHANNEL, { event: BANNED_LIST, fullList });
        // Starting operation in progress just presents as a bug to the user because freezes all buttons so just log
        console.info('Beginning inline versions update');
        console.info(inlineList);
        const inlineMarketsStruct = {};
        return updateMarkets(inlineList, inlineMarketsStruct, MAX_CONCURRENT_API_CALLS, true)
          .then(() => {
            sendMarketsStruct(inlineMarketsStruct);
            const foregroundMarketsStruct = {};
            console.info('Beginning foreground versions update');
            console.info(foregroundList);
            return updateMarkets(foregroundList, foregroundMarketsStruct, MAX_CONCURRENT_API_CALLS).then(() => {
              sendMarketsStruct(foregroundMarketsStruct);
              const backgroundMarketsStruct = {};
              console.info('Finished foreground update');
              refreshNotifications();
              // for now just always fetch the home user without signatures but after foreground so serves as marker
              return getHomeAccountUser().then((user) => {
                // we bothered to fetch the data, so we should use it:)
                pushMessage(PUSH_HOME_USER_CHANNEL, { event: VERSIONS_EVENT, user });
                console.info('Beginning background versions update');
                console.info(backgroundList);
                return updateMarkets(backgroundList, backgroundMarketsStruct, MAX_CONCURRENT_ARCHIVE_API_CALLS)
                  .then(() => {
                    sendMarketsStruct(backgroundMarketsStruct);
                    console.info('Ending versions update');
                  });
              });
            });
          });
      });
    });
}

/**
 * Refreshes a given market using the component signatures to map against
 * @param marketId the market id to refresh
 * @param componentSignatures the component signatures telling us what we're looking for
 * @param marketsStruct
 * @returns {null}
 */
async function doRefreshMarket(marketId, componentSignatures, marketsStruct) {
  const serverFetchSignatures = getFetchSignaturesForMarket(componentSignatures);
  const fromStorage = await checkInStorage(marketId, serverFetchSignatures);
  const { markets, comments, marketPresences, marketStages, investibles } = fromStorage;
  let chain = null;
  if (!_.isEmpty(markets.unmatchedSignatures)) {
    chain = fetchMarketVersion(marketId, markets.unmatchedSignatures[0], marketsStruct); // can only be one :)
  }
  if (!_.isEmpty(comments.unmatchedSignatures)) {
    chain = chain ? chain.then(() => fetchMarketComments(marketId, comments, marketsStruct))
      : fetchMarketComments(marketId, comments, marketsStruct);
  }
  if (!_.isEmpty(investibles.unmatchedSignatures)) {
    chain = chain ? chain.then(() => fetchMarketInvestibles(marketId, investibles, marketsStruct))
      : fetchMarketInvestibles(marketId, investibles, marketsStruct);
  }
  if (!_.isEmpty(marketPresences.unmatchedSignatures)) {
    chain = chain ? chain.then(() => fetchMarketPresences(marketId, marketPresences, marketsStruct))
      : fetchMarketPresences(marketId, marketPresences, marketsStruct);
  }
  if (!_.isEmpty(marketStages.unmatchedSignatures)) {
    chain = chain ? chain.then(() => fetchMarketStages(marketId, marketStages, marketsStruct))
      : fetchMarketStages(marketId, marketStages, marketsStruct);
  }
  return chain;
}

function fetchMarketVersion (marketId, marketSignature, marketsStruct) {
  return getMarketDetails(marketId)
    .then((marketDetails) => {
      // console.log(marketDetails);
      const match = signatureMatcher([marketDetails], [marketSignature]);
      // we bothered to fetch the data, so we should use it:)
      addMarketsStructInfo('markets', marketsStruct, [marketDetails]);
      if (!match.allMatched) {
        console.warn(match.unmatchedSignatures);
        throw new MatchError('Market didn\'t match');
      }
    });
}

function fetchMarketComments (marketId, allComments, marketsStruct) {
  const commentsSignatures = allComments.unmatchedSignatures;
  const commentIds = commentsSignatures.map((comment) => comment.id);
  return fetchComments(commentIds, marketId)
    .then((comments) => {
      const match = signatureMatcher(comments, commentsSignatures);
      addMarketsStructInfo('comments', marketsStruct, comments, marketId);
      if (!match.allMatched) {
        console.warn(match.unmatchedSignatures);
        throw new MatchError('Comments didn\'t match');
      }
    });
}

function fetchMarketInvestibles (marketId, allInvestibles, marketsStruct) {
  const investiblesSignatures = allInvestibles.unmatchedSignatures;
  const investibleIds = investiblesSignatures.map((inv) => inv.investible.id);
  return fetchInvestibles(investibleIds, marketId)
    .then((investibles) => {
      const match = signatureMatcher(investibles, investiblesSignatures);
      addMarketsStructInfo('investibles', marketsStruct, investibles);
      if (!match.allMatched) {
        console.warn(match.unmatchedSignatures);
        throw new MatchError('Investibles didn\'t match');
      }
    });
}

function fetchMarketPresences (marketId, allMp, marketsStruct) {
  const mpSignatures = allMp.unmatchedSignatures;
  return getMarketUsers(marketId)
    .then((users) => {
      const match = signatureMatcher(users, mpSignatures);
      addMarketsStructInfo('users', marketsStruct, users, marketId);
      if (!match.allMatched) {
        console.warn(match.unmatchedSignatures);
        throw new MatchError('Presences didn\'t match');
      }
    });
}

function fetchMarketStages (marketId, allMs, marketsStruct) {
  const msSignatures = allMs.unmatchedSignatures;
  return getMarketStages(marketId)
    .then((stages) => {
      const match = signatureMatcher(stages, msSignatures);
      addMarketsStructInfo('stages', marketsStruct, stages, marketId);
      if (!match.allMatched) {
        console.warn(match.unmatchedSignatures);
        throw new MatchError('Stages didn\'t match');
      }
    });
}