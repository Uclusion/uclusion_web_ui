import _ from 'lodash'
import { pushMessage, registerListener, removeListener } from '../utils/MessageBusUtils'
import { getVersions } from './summaries'
import { getMarketDetails, getMarketStages, getMarketUsers } from './markets'
import {
  getFetchSignaturesForAccount,
  getFetchSignaturesForMarket,
  signatureMatcher,
  versionIsStale
} from './versionSignatureUtils'
import {
  addMinimumVersionRequirement,
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
function startGlobalRefreshTimerChain() {
  return new Promise((resolve, reject) => {
    const execFunction = () => {
      const disk = new LocalForageHelper(VERSIONS_CONTEXT_NAMESPACE);
      let currentHeldVersion;
      return disk.getState()
        .then((state) => {
          const {
            existingMarkets,
            globalVersion,
            requiredSignatures,
          } = state || {};
          currentHeldVersion = globalVersion;
          return doVersionRefresh(currentHeldVersion, existingMarkets, requiredSignatures);
        }).then((globalVersion) => {
          if (globalVersion !== currentHeldVersion) {
            // console.log('Got new version');
            pushMessage(VERSIONS_HUB_CHANNEL, { event: GLOBAL_VERSION_UPDATE, globalVersion });
          }
          resolve(true);
          return Promise.resolve(true);
        }).catch((error) => {
          // we'll log match problems, but raise the rest
          if (error instanceof MatchError) {
            console.error(error.message);
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
export function refreshGlobalVersion () {
  // WAIT UNTIL VERSIONS CONTEXT LOAD COMPLETES BEFORE DOING ANY API CALL
  const disk = new LocalForageHelper(VERSIONS_CONTEXT_NAMESPACE);
  return disk.getState()
    .then((state) => {
      const { globalVersion } = state || {};
      // if the global version is the empty global version or just empty
      // then we're an initial login
      // and we can't let that happen in parallel as it's too costly
      // otherwise we can let things happen in parallel
      if (globalVersion === EMPTY_GLOBAL_VERSION || _.isEmpty(globalVersion) ) {
        globalFetchPromiseChain = globalFetchPromiseChain
          .then(() => {
            return startGlobalRefreshTimerChain();
          });
        return globalFetchPromiseChain;
      }
      // we're already initialized, so go ahead and let them happen in parallel
      return startGlobalRefreshTimerChain();
    });
}

/**
 * add a listener to all places a market can show up, then kick off global version to make sure it gets filled
 * @param id
 * @param version
 * @param versionsDispatch
 * @param history
 * @returns {Promise<*>}
 */
export function pollForMarketLoad(id, version, versionsDispatch, history, shouldRedirect) {
  addMinimumVersionRequirement(versionsDispatch, { id, version });
  function redirectToMarket() {
    console.log(`Redirecting us to market ${id}`);
    navigate(history, formMarketLink(id));
  }
  registerListener(VERSIONS_HUB_CHANNEL, 'inviteListenerNewMarket', (data) => {
    const { payload: { event, marketId: messageMarketId } } = data;
    switch (event) {
      case  NEW_MARKET:
        if (messageMarketId === id) {
          removeListener(VERSIONS_HUB_CHANNEL, 'inviteListenerNewMarket');
          if (shouldRedirect) {
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
          if (shouldRedirect) {
            redirectToMarket();
          }
        }
        break;
      default:
      // console.debug(`Ignoring identity event ${event}`);
    }
  });
  return refreshVersions();
}

/**
 * Splits the market signatures into foreground and background lists
 * @param marketSignatures
 * @param foregroundList
 * @returns {{background: *, foreground: []}|{background: *, foreground: *}}
 */
function splitIntoForegroundBackground (marketSignatures, foregroundList) {
  if (_.isEmpty(foregroundList)) {
    return { foreground: [], background: marketSignatures };
  }
  const foreground = marketSignatures.filter((ms) => foregroundList.includes(ms.market_id));
  const background = marketSignatures.filter((ms) => !foregroundList.includes(ms.market_id));
  return {
    foreground,
    background,
  };
}

/**
 * Updates all the accounts from the passed in signatures
 * @param accountSignatures the signatures the account fetch has to match
 * @param maxConcurrencyCount the maximum number of api calls to make at once
 */
function updateAccountFromSignatures (accountSignatures, maxConcurrencyCount=1) {
  return LimitedParallelMap(accountSignatures, accountSignature => {
    // we really only know how to update _our_ account
    const { signatures: componentSignatures } = accountSignature;
      return doRefreshAccount(componentSignatures);
  }, maxConcurrencyCount)
}


/**
 * Updates all our markets from the passed in signatures
 * @param marketSignatures the market signatures to drive the update
 * @param existingMarkets the list of markets we currently know about
 * @param maxConcurrentCount the maximum number of api calls to make at once
 * @returns {Promise<*>}
 */
function updateMarketsFromSignatures (marketSignatures, existingMarkets, maxConcurrentCount) {
  return LimitedParallelMap(marketSignatures, (marketSignature) => {
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
}

/**
 * Function that will make exactly one attempt to update the global versions
 * USed if you have some other control and want access to the promise chain
 * @param currentHeldVersion
 * @param existingMarkets
 * @oaram requiredSignatures we will ignore any global version fetched from the server,
 * that doesn't have signatures that match what we want
 * @returns {Promise<*>}
 */
export function doVersionRefresh (currentHeldVersion, existingMarkets, requiredSignatures) {
  let newGlobalVersion = currentHeldVersion;
  const globalLockEnabled = config.globalLockEnabled === 'true' || !currentHeldVersion
    || currentHeldVersion === 'INITIALIZATION';
  if (globalLockEnabled) {
    pushMessage(OPERATION_HUB_CHANNEL, { event: START_OPERATION });
  }
  const callWithVersion = currentHeldVersion === 'INITIALIZATION' ? null : currentHeldVersion;
  return getVersions(callWithVersion)
    .then((versions) => {
      const {
        global_version, signatures: newSignatures, foreground: foregroundList,
        banned: bannedList
      } = versions;
      const marketSignatures = newSignatures.filter((signature) => signature.market_id);
      const accountSignatures = newSignatures.filter((signature) => signature.account_id);
      // if the market signatures don't have the required signatures, just abort, this version has stale data
      if (versionIsStale(marketSignatures, requiredSignatures)) {
        console.log('Skipping stale version');
        return currentHeldVersion;
      }
      if ((_.isEmpty(marketSignatures) && _.isEmpty(accountSignatures)) || _.isEmpty(global_version)) {
        pushMessage(OPERATION_HUB_CHANNEL, { event: STOP_OPERATION });
        return currentHeldVersion;
      }
      // don't refresh market's we're banned from
      if (!_.isEmpty(bannedList)) {
        pushMessage(REMOVED_MARKETS_CHANNEL, { event: BANNED_LIST, bannedList });
      }

     // split the market stuff into forground and background
      newGlobalVersion = global_version;
      const splitMS = splitIntoForegroundBackground(marketSignatures, foregroundList);
      const { foreground, background } = splitMS;
      const marketPromises = updateMarketsFromSignatures(foreground, existingMarkets, MAX_CONCURRENT_API_CALLS)
        .then(() => {
          pushMessage(OPERATION_HUB_CHANNEL, { event: STOP_OPERATION });
          return updateMarketsFromSignatures(background, existingMarkets, MAX_CONCURRENT_ARCHIVE_API_CALLS)
            .then(() => {
              return newGlobalVersion;
            });
        });
      // fetch the account before the market if we have to
      if (!_.isEmpty(accountSignatures)){
        return updateAccountFromSignatures(accountSignatures, MAX_CONCURRENT_API_CALLS)
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
function doRefreshMarket (marketId, componentSignatures) {
  //console.debug(`Refreshing market ${marketId}`);
  const fetchSignatures = getFetchSignaturesForMarket(componentSignatures);
  // console.log(fetchSignatures);
  const { markets, comments, marketPresences, marketStages, investibles } = fetchSignatures;
  let chain = null;
  if (!_.isEmpty(markets)) {
    chain = fetchMarketVersion(marketId, markets[0]); // can only be one market object per market:)
  }
  // When there is a deletion should receive an empty signature for that type
  // TODO we don't handle rare case of admin deletes dialog investible and it was on two devices
  if (!_.isEmpty(comments)) {
    chain = chain ? chain.then(() => fetchMarketComments(marketId, comments)) : fetchMarketComments(marketId, comments);
  } else if (componentSignatures.find((signature) => signature.type === 'comment')) {
    // We are not keeping zero version around anymore so handle the rare case of last comment deleted
    pushMessage(PUSH_COMMENTS_CHANNEL, { event: VERSIONS_EVENT, marketId, comments: [] });
  }
  if (!_.isEmpty(investibles)) {
    chain = chain ? chain.then(() => fetchMarketInvestibles(marketId, investibles)) : fetchMarketInvestibles(marketId, investibles);
  }
  if (!_.isEmpty(marketPresences) || componentSignatures.find((signature) => signature.type === 'investment')) {
    // Handle the case of the last investment being deleted by just refreshing users
    chain = chain ? chain.then(() => fetchMarketPresences(marketId, marketPresences || [])) : fetchMarketPresences(marketId, marketPresences || []);
  }
  if (!_.isEmpty(marketStages)) {
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

function fetchMarketComments (marketId, commentsSignatures) {
  const commentIds = commentsSignatures.map((comment) => comment.id);
  return fetchComments(commentIds, marketId)
    .then((comments) => {
      const match = signatureMatcher(comments, commentsSignatures);
      pushMessage(PUSH_COMMENTS_CHANNEL, { event: VERSIONS_EVENT, marketId, comments });
      if (!match.allMatched) {
        throw new MatchError('Comments didn\'t match');
      }
    });
}

function fetchMarketInvestibles (marketId, investiblesSignatures) {
  const investibleIds = investiblesSignatures.map((inv) => inv.investible.id);
  return fetchInvestibles(investibleIds, marketId)
    .then((investibles) => {
      const match = signatureMatcher(investibles, investiblesSignatures);
      pushMessage(PUSH_INVESTIBLES_CHANNEL, { event: VERSIONS_EVENT, marketId, investibles });
      if (!match.allMatched) {
        throw new MatchError('Investibles didn\'t match');
      }
    });
}

function fetchMarketPresences (marketId, mpSignatures) {
  return getMarketUsers(marketId)
    .then((users) => {
      const match = signatureMatcher(users, mpSignatures);
      pushMessage(PUSH_PRESENCE_CHANNEL, { event: VERSIONS_EVENT, marketId, users });
      if (!match.allMatched) {
        throw new MatchError('Presences didn\'t match');
      }
    });
}

function fetchMarketStages (marketId, msSignatures) {
  return getMarketStages(marketId)
    .then((stages) => {
      const match = signatureMatcher(stages, msSignatures);
      pushMessage(PUSH_STAGE_CHANNEL, { event: VERSIONS_EVENT, marketId, stages });
      if (!match.allMatched) {
        throw new MatchError('Stages didn\'t match');
      }
    });
}