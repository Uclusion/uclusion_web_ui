import _ from 'lodash'
import { pushMessage, registerListener, removeListener } from '../utils/MessageBusUtils'
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
  refreshVersions,
  REMOVED_MARKETS_CHANNEL,
  VERSIONS_EVENT
} from '../contexts/VersionsContext/versionsContextHelper'
import { fetchComments } from './comments'
import { fetchInvestibles } from './marketInvestibles'
import { LimitedParallelMap } from '../utils/PromiseUtils'
import { startTimerChain } from '../utils/timerUtils'
import { MARKET_MESSAGE_EVENT, VERSIONS_HUB_CHANNEL } from '../contexts/WebSocketContext'
import { GLOBAL_VERSION_UPDATE, NEW_MARKET, } from '../contexts/VersionsContext/versionsContextMessages'
import {
  OPERATION_HUB_CHANNEL,
  START_OPERATION,
  STOP_OPERATION
} from '../contexts/OperationInProgressContext/operationInProgressMessages'
import config from '../config'
import LocalForageHelper from '../utils/LocalForageHelper'
import { EMPTY_GLOBAL_VERSION, VERSIONS_CONTEXT_NAMESPACE } from '../contexts/VersionsContext/versionsContextReducer'
import { getHomeAccountUser } from './sso'
import { formMarketLink, navigate } from '../utils/marketIdPathFunctions'
import { checkInStorage } from './storageIntrospector'

const MAX_RETRIES = 10;
const MAX_CONCURRENT_API_CALLS = 5;
const MAX_CONCURRENT_ARCHIVE_API_CALLS = 1;


export class MatchError extends Error {

}

let globalFetchPromiseChain = Promise.resolve(true);

/**
 * Starts off a global refresh timer.
 * @returns {Promise<unknown>}
 */
function startGlobalRefreshTimerChain(refreshAll) {
  return new Promise((resolve, reject) => {
    const execFunction = () => {
      const disk = new LocalForageHelper(VERSIONS_CONTEXT_NAMESPACE);
      let currentHeldVersion;
      return disk.getState()
        .then((state) => {
          const {
            existingMarkets,
            globalVersion,
          } = state || {};
          // if we're refreshing all we're going back to initialization state
          currentHeldVersion = refreshAll? 'INITIALIZATION' : globalVersion;
          return doVersionRefresh(currentHeldVersion, existingMarkets);
        }).then((globalVersion) => {
          if (globalVersion !== currentHeldVersion) {
            // console.log('Got new version');
            pushMessage(VERSIONS_HUB_CHANNEL, { event: GLOBAL_VERSION_UPDATE, globalVersion });
          }
          resolve(true);
          return Promise.resolve(true);
        }).catch((error) => {
          console.error(error.message);
          // we'll log match problems, but raise the rest
          if (error instanceof MatchError) {
            return false;
          } else {
            reject(error);
          }
        });
    };
    startTimerChain(6000, MAX_RETRIES, execFunction);
  });
}

/**
 * Refreshes the global version
 * need to consider the fetch complete.
 * @returns {Promise<*>}
 */
export function refreshGlobalVersion (refreshCalled) {
  // WAIT UNTIL VERSIONS CONTEXT LOAD COMPLETES BEFORE DOING ANY API CALL
  const disk = new LocalForageHelper(VERSIONS_CONTEXT_NAMESPACE);
  return disk.getState()
    .then((state) => {
      const { globalVersion } = state || {};
      // if the global version is the empty global version or just empty,
      // or we're a refresh then we're requivalent to an initial login
      // and we can't let that happen in parallel as it's too costly
      // otherwise we can let things happen in parallel
      if (refreshCalled || globalVersion === EMPTY_GLOBAL_VERSION || _.isEmpty(globalVersion) ) {
        globalFetchPromiseChain = globalFetchPromiseChain
          .then(() => {
            return startGlobalRefreshTimerChain(refreshCalled);
          });
        return globalFetchPromiseChain;
      }
      // we're already initialized, so go ahead and let them happen in parallel
      return startGlobalRefreshTimerChain(refreshCalled);
    });
}

/**
 * add a listener to all places a market can show up, then kick off global version to make sure it gets filled
 * @param id
 * @param history
 * @returns {Promise<*>}
 */
export function pollForMarketLoad(id, history) {
  function redirectToMarket() {
    console.log(`Redirecting us to market ${id}`);
    navigate(history, formMarketLink(id));
  }
  if (history) {
    registerListener(VERSIONS_HUB_CHANNEL, 'inviteListenerNewMarket', (data) => {
      const { payload: { event, marketId: messageMarketId } } = data;
      switch (event) {
        case  NEW_MARKET:
          if (messageMarketId === id) {
            removeListener(VERSIONS_HUB_CHANNEL, 'inviteListenerNewMarket');
            if (history) {
              redirectToMarket();
            }
          }
          break;
        default:
        //console.debug(`Ignoring event`);
      }
    });
    registerListener(PUSH_MARKETS_CHANNEL, 'marketPushInvite', (data) => {
      const { payload: { event, marketDetails } } = data;
      switch (event) {
        case VERSIONS_EVENT:
          // console.debug(`Markets context responding to updated market event ${event}`);
          if (marketDetails.id === id) {
            removeListener(PUSH_MARKETS_CHANNEL, 'marketPushInvite');
            if (history) {
              redirectToMarket();
            }
          }
          break;
        default:
        // console.debug(`Ignoring identity event ${event}`);
      }
    });
  }
  return refreshVersions();
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
 * @param existingMarkets the list of markets we currently know about
 * @param maxConcurrentCount the maximum number of api calls to make at once
 * @returns {Promise<*>}
 */
function updateMarketsFromSignatures (marketIds, existingMarkets, maxConcurrentCount) {
  return getVersions(marketIds)
    .then((marketSignatures) => {
      //console.error(marketSignatures);
      return LimitedParallelMap(marketSignatures, (marketSignature) => {
        //console.error("MarketSignature")
        //console.error(marketSignature);
        const { market_id: marketId, signatures: componentSignatures } = marketSignature;
        let promise = doRefreshMarket(marketId, componentSignatures);
        if (!_.isEmpty(promise)) {
          // send a notification to the versions channel saying we have incoming stuff
          // for this market
          pushMessage(VERSIONS_HUB_CHANNEL, { event: MARKET_MESSAGE_EVENT, marketId });
        }
        if (!existingMarkets || !existingMarkets.includes(marketId)) {
          pushMessage(VERSIONS_HUB_CHANNEL, { event: NEW_MARKET, marketId });
        }
        return promise;
      }, maxConcurrentCount);
    });
}

/**
 * Function that will make exactly one attempt to update the global versions
 * USed if you have some other control and want access to the promise chain
 * @param currentHeldVersion
 * @param existingMarkets
 * @returns {Promise<*>}
 */
export function doVersionRefresh (currentHeldVersion, existingMarkets) {
  let newGlobalVersion = currentHeldVersion;
  const globalLockEnabled = config.globalLockEnabled === 'true' || !currentHeldVersion
    || currentHeldVersion === 'INITIALIZATION';
  if (globalLockEnabled) {
    pushMessage(OPERATION_HUB_CHANNEL, { event: START_OPERATION });
  }
  const callWithVersion = currentHeldVersion === 'INITIALIZATION' ? null : currentHeldVersion;
  return getChangedIds(callWithVersion)
    .then((versions) => {
      const {
        global_version, foreground: foregroundList, account: accountId, background: backgroundList,
        banned: bannedList
      } = versions;
    //  const marketSignatures = newSignatures.filter((signature) => signature.market_id);
    ///  const accountSignatures = newSignatures.filter((signature) => signature.account_id);
      // if the market signatures don't have the required signatures, just abort, this version has stale data
      if ((_.isEmpty(foregroundList) && _.isEmpty(backgroundList) && _.isEmpty(accountId)) || _.isEmpty(global_version)) {
        pushMessage(OPERATION_HUB_CHANNEL, { event: STOP_OPERATION });
        return currentHeldVersion;
      }
      // don't refresh market's we're banned from
      if (!_.isEmpty(bannedList)) {
        pushMessage(REMOVED_MARKETS_CHANNEL, { event: BANNED_LIST, bannedList });
      }
      // split the market stuff into foreground and background
      newGlobalVersion = global_version;
     const marketPromises = updateMarketsFromSignatures(foregroundList, existingMarkets, MAX_CONCURRENT_API_CALLS)
        .then(() => {
          pushMessage(OPERATION_HUB_CHANNEL, { event: STOP_OPERATION });
          return updateMarketsFromSignatures(backgroundList, existingMarkets, MAX_CONCURRENT_ARCHIVE_API_CALLS)
            .then(() => {
              return newGlobalVersion;
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
 * @returns {null}
 */
async function doRefreshMarket (marketId, componentSignatures) {
  const serverFetchSignatures = getFetchSignaturesForMarket(componentSignatures);
  const fromStorage = await checkInStorage(marketId, serverFetchSignatures);
  //console.error(fetchSignatures);
  const { markets, comments, marketPresences, marketStages, investibles } = fromStorage;
  let chain = null;
  if (!_.isEmpty(markets.unmatchedSignatures)) {
    chain = fetchMarketVersion(marketId, markets.unmatchedSignatures[0]); // can only be one market object per market:)
  }
  if (!_.isEmpty(comments.unmatchedSignatures)) {
    chain = chain ? chain.then(() => fetchMarketComments(marketId, comments)) : fetchMarketComments(marketId, comments);
  }
  if (!_.isEmpty(investibles.unmatchedSignatures)) {
    chain = chain ? chain.then(() => fetchMarketInvestibles(marketId, investibles)) : fetchMarketInvestibles(marketId, investibles);
  }
  if (!_.isEmpty(marketPresences.unmatchedSignatures)) {
    chain = chain ? chain.then(() => fetchMarketPresences(marketId, marketPresences)) : fetchMarketPresences(marketId, marketPresences);
  }
  if (!_.isEmpty(marketStages.unmatchedSignatures)) {
    chain = chain ? chain.then(() => fetchMarketStages(marketId, marketStages)) : fetchMarketStages(marketId, marketStages);
  }
  return chain;
}

function fetchMarketVersion (marketId, marketSignature) {
  return getMarketDetails(marketId)
    .then((marketDetails) => {
      // console.log(marketDetails);
      const match = signatureMatcher([marketDetails], [marketSignature]);
      // we bothered to fetch the data, so we should use it:)
      pushMessage(PUSH_MARKETS_CHANNEL, { event: VERSIONS_EVENT, marketDetails });
      if (!match.allMatched) {
        throw new MatchError('Market didn\'t match');
      }
    });
}

function fetchMarketComments (marketId, allComments) {
  const commentsSignatures = allComments.unmatchedSignatures;
  const commentIds = commentsSignatures.map((comment) => comment.id);
  return fetchComments(commentIds, marketId)
    .then((comments) => {
      const match = signatureMatcher(comments, commentsSignatures);
      pushMessage(PUSH_COMMENTS_CHANNEL, { event: VERSIONS_EVENT, marketId,
        comments: allComments.matched.concat(comments)});
      if (!match.allMatched) {
        throw new MatchError('Comments didn\'t match');
      }
    });
}

function fetchMarketInvestibles (marketId, allInvestibles) {
  const investiblesSignatures = allInvestibles.unmatchedSignatures;
  const investibleIds = investiblesSignatures.map((inv) => inv.investible.id);
  return fetchInvestibles(investibleIds, marketId)
    .then((investibles) => {
      const match = signatureMatcher(investibles, investiblesSignatures);
      pushMessage(PUSH_INVESTIBLES_CHANNEL, { event: VERSIONS_EVENT, marketId,
        investibles: allInvestibles.matched.concat(investibles) });
      if (!match.allMatched) {
        throw new MatchError('Investibles didn\'t match');
      }
    });
}

function fetchMarketPresences (marketId, allMp) {
  const mpSignatures = allMp.unmatchedSignatures;
  return getMarketUsers(marketId)
    .then((users) => {
      const match = signatureMatcher(users, mpSignatures);
      pushMessage(PUSH_PRESENCE_CHANNEL, { event: VERSIONS_EVENT, marketId, users });
      if (!match.allMatched) {
        throw new MatchError('Presences didn\'t match');
      }
    });
}

function fetchMarketStages (marketId, allMs) {
  const msSignatures = allMs.unmatchedSignatures;
  return getMarketStages(marketId)
    .then((stages) => {
      const match = signatureMatcher(stages, msSignatures);
      pushMessage(PUSH_STAGE_CHANNEL, { event: VERSIONS_EVENT, marketId, stages });
      if (!match.allMatched) {
        throw new MatchError('Stages didn\'t match');
      }
    });
}