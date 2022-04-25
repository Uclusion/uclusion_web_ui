import _ from 'lodash'
import { pushMessage } from '../utils/MessageBusUtils'
import { getChangedIds, getVersions } from './summaries'
import { getMarketDetails, getMarketStages, getMarketUsers } from './markets'
import { getFetchSignaturesForAccount, getFetchSignaturesForMarket, signatureMatcher, } from './versionSignatureUtils'
import {
  BANNED_LIST,
  PUSH_COMMENTS_CHANNEL,
  PUSH_HOME_USER_CHANNEL,
  PUSH_INVESTIBLES_CHANNEL,
  PUSH_MARKETS_CHANNEL,
  PUSH_PRESENCE_CHANNEL,
  PUSH_STAGE_CHANNEL,
  refreshNotifications,
  REMOVED_MARKETS_CHANNEL,
  VERSIONS_EVENT
} from '../contexts/VersionsContext/versionsContextHelper'
import { fetchComments } from './comments'
import { fetchInvestibles } from './marketInvestibles'
import { LimitedParallelMap } from '../utils/PromiseUtils'
import { startTimerChain } from '../utils/timerUtils'
import { VERSIONS_HUB_CHANNEL } from '../contexts/WebSocketContext'
import { GLOBAL_VERSION_UPDATE } from '../contexts/VersionsContext/versionsContextMessages'
import LocalForageHelper from '../utils/LocalForageHelper'
import { VERSIONS_CONTEXT_NAMESPACE } from '../contexts/VersionsContext/versionsContextReducer'
import { getHomeAccountUser } from './sso'
import { checkInStorage } from './storageIntrospector'

const MAX_RETRIES = 10;
const MAX_CONCURRENT_API_CALLS = 5;
const MAX_CONCURRENT_ARCHIVE_API_CALLS = 1;


export class MatchError extends Error {

}

let globalFetchPromiseChain = Promise.resolve(true);
let globalFetchPromiseTracker = {inProgress: 0};

export function executeRefreshTimerChain(refreshAll, resolve, reject) {
  const execFunction = () => {
    const disk = new LocalForageHelper(VERSIONS_CONTEXT_NAMESPACE);
    let currentHeldVersion;
    return disk.getState()
      .then((state) => {
        const { globalVersion } = state || {};
        const { lastCallVersion } = globalFetchPromiseTracker;
        // if we're refreshing all we're going back to initialization state
        currentHeldVersion = refreshAll? 'INITIALIZATION' : (lastCallVersion ? lastCallVersion : globalVersion);
        return doVersionRefresh(currentHeldVersion);
      }).then((globalVersion) => {
        globalFetchPromiseTracker.inProgress -= 1;
        if (globalVersion !== currentHeldVersion) {
          globalFetchPromiseTracker.lastCallVersion = globalVersion;
          // console.log('Got new version');
          pushMessage(VERSIONS_HUB_CHANNEL, { event: GLOBAL_VERSION_UPDATE, globalVersion });
        }
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
 * Updates all the accounts from the passed in signatures
 * @param accountId the account ID we need to sync
 * @param maxConcurrencyCount the maximum number of api calls to make at once
 */
function updateAccountFromSignatures (accountId, maxConcurrencyCount = 1) {
  return getVersions([accountId])
    .then((accountSignatures) => {
      return LimitedParallelMap(accountSignatures, accountSignature => {
        // we really only know how to update _our_ account
        const { signatures: componentSignatures } = accountSignature;
        return doRefreshAccount(componentSignatures);
      }, maxConcurrencyCount);
    });
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
 * Function that will make exactly one attempt to update the global versions
 * USed if you have some other control and want access to the promise chain
 * @param currentHeldVersion
 * @returns {Promise<*>}
 */
export function doVersionRefresh(currentHeldVersion) {
  let newGlobalVersion = currentHeldVersion;
  const callWithVersion = currentHeldVersion === 'INITIALIZATION' ? null : currentHeldVersion;
  console.info(`Checking for sync with ${callWithVersion}`);
  return getChangedIds(callWithVersion)
    .then((versions) => {
      const {
        global_version, foreground: foregroundList, account: accountId, background: backgroundList,
        banned: bannedList, inline: inlineList
      } = versions;
      // If nothing changed then will get empty or null back for these lists
      if ((_.isEmpty(foregroundList) && _.isEmpty(backgroundList) && _.isEmpty(accountId) && _.isEmpty(inlineList))
        || _.isEmpty(global_version)) {
        return currentHeldVersion;
      }
      // don't refresh market's we're banned from
      if (!_.isEmpty(bannedList)) {
        pushMessage(REMOVED_MARKETS_CHANNEL, { event: BANNED_LIST, bannedList });
      }
      // split the market stuff into inline, foreground and background where inline must come first
      // to avoid seeing incomplete comments
      newGlobalVersion = global_version;
      // Starting operation in progress just presents as a bug to the user because freezes all buttons so just log
      console.info(`Beginning versions update for ${global_version}`);
      const inlineMarketsStruct = {};
      const marketPromises = updateMarkets(inlineList, inlineMarketsStruct, MAX_CONCURRENT_API_CALLS, true)
        .then(() => {
          sendMarketsStruct(inlineMarketsStruct);
           const foregroundMarketsStruct = {};
           return updateMarkets(foregroundList, foregroundMarketsStruct, MAX_CONCURRENT_API_CALLS).then(() => {
             sendMarketsStruct(foregroundMarketsStruct);
             const backgroundMarketsStruct = {};
             console.info(`Finished foreground update for ${global_version}`);
             refreshNotifications();
             return updateMarkets(backgroundList, backgroundMarketsStruct, MAX_CONCURRENT_ARCHIVE_API_CALLS)
               .then(() => {
                 sendMarketsStruct(backgroundMarketsStruct);
                 console.info(`Ending versions update for ${global_version}`);
                 return newGlobalVersion;
               });
           });
       });
      // fetch the account before the market if we have to
      if (!_.isEmpty(accountId)) {
        return updateAccountFromSignatures(accountId, MAX_CONCURRENT_API_CALLS)
          .then(() => marketPromises);
      }
      return marketPromises;
    });
}

/** We really only know how to refresh the home account at this point,
 * so we don't take the account or actual user ID into very much
 * consideration, but eventually it will
 * @param componentSignatures the signatures for the home account
 */
function doRefreshAccount (componentSignatures) {
  const fetchSignatures = getFetchSignaturesForAccount(componentSignatures);
  const { users: usersSignatures } = fetchSignatures;
  if (!_.isEmpty(usersSignatures)) {
    return getHomeAccountUser()
      .then((user) => {
        const match = signatureMatcher([user], usersSignatures);
        // we bothered to fetch the data, so we should use it:)
        pushMessage(PUSH_HOME_USER_CHANNEL, { event: VERSIONS_EVENT, user });
        if (!match.allMatched) {
          throw new MatchError('Users didn\'t match');
        }
      });
  }
  return null;
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
        throw new MatchError('Stages didn\'t match');
      }
    });
}