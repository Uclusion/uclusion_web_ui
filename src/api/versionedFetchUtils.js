import _ from 'lodash'
import { pushMessage } from '../utils/MessageBusUtils'
import { getChangedIds, getVersions } from './summaries'
import { getGroupMembers, getMarketDetails, getMarketGroups, getMarketStages, getMarketUsers } from './markets'
import { getFetchSignaturesForMarket, signatureMatcher, } from './versionSignatureUtils'
import { fetchComments } from './comments'
import { fetchInvestibles } from './marketInvestibles'
import { LimitedParallelMap } from '../utils/PromiseUtils'
import { startTimerChain } from '../utils/timerUtils'
import { checkInStorage, checkSignatureInStorage } from './storageIntrospector'
import LocalForageHelper from '../utils/LocalForageHelper'
import { COMMENTS_CONTEXT_NAMESPACE } from '../contexts/CommentsContext/CommentsContext'
import { INVESTIBLES_CONTEXT_NAMESPACE } from '../contexts/InvestibesContext/InvestiblesContext'
import { MARKET_CONTEXT_NAMESPACE } from '../contexts/MarketsContext/MarketsContext'
import { MARKET_PRESENCES_CONTEXT_NAMESPACE } from '../contexts/MarketPresencesContext/MarketPresencesContext'
import { MARKET_STAGES_CONTEXT_NAMESPACE } from '../contexts/MarketStagesContext/MarketStagesContext'
import { getFailedSignatures } from '../contexts/MarketsContext/marketsContextHelper'
import { MARKET_GROUPS_CONTEXT_NAMESPACE } from '../contexts/MarketGroupsContext/MarketGroupsContext';
import { GROUP_MEMBERS_CONTEXT_NAMESPACE } from '../contexts/GroupMembersContext/GroupMembersContext'

const MAX_RETRIES = 10;
const MAX_CONCURRENT_API_CALLS = 5;
const MAX_CONCURRENT_ARCHIVE_API_CALLS = 1;
export const NOTIFICATIONS_HUB_CHANNEL = 'NotificationsChannel';
export const PUSH_MARKETS_CHANNEL = 'MarketsChannel';
export const PUSH_COMMENTS_CHANNEL = 'CommentsChannel';
export const PUSH_INVESTIBLES_CHANNEL = 'InvestiblesChannel';
export const PUSH_PRESENCE_CHANNEL = 'PresenceChannel';
export const PUSH_MEMBER_CHANNEL = 'MemberChannel';
// Channel used when you're banned. We purge your stuff from the local store if you are.
export const REMOVED_MARKETS_CHANNEL = 'RemovedMarketsChannel';
export const PUSH_STAGE_CHANNEL = 'MarketsStagesChannel';
export const PUSH_GROUPS_CHANNEL = 'MarketsGroupsChannel';
export const VERSIONS_EVENT = 'version_push';
export const BANNED_LIST = 'banned_list';
export const SYNC_ERROR_EVENT = 'sync_error';

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
 * @param storageStates
 * @param isInline whether the markets are inline or not
 * @returns {Promise<*>}
 */
export function updateMarkets(marketIds, marketsStruct, maxConcurrentCount, storageStates, isInline=false) {
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
        return doRefreshMarket(marketId, componentSignatures, marketsStruct, storageStates);
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
  if (marketsStruct['group']) {
    pushMessage(PUSH_GROUPS_CHANNEL, { event: VERSIONS_EVENT, groupDetails: marketsStruct['group']});
  }
  if (marketsStruct['members']) {
    pushMessage(PUSH_MEMBER_CHANNEL, { event: VERSIONS_EVENT, memberDetails: marketsStruct['members']});
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

export function getStorageStates() {
  const storageStates = {};
  const helper = new LocalForageHelper(COMMENTS_CONTEXT_NAMESPACE);
  return helper.getState().then((state) => {
    storageStates.commentsState = state || {};
    const helper = new LocalForageHelper(INVESTIBLES_CONTEXT_NAMESPACE);
    return helper.getState();
  }).then((state) => {
    storageStates.investiblesState = state || {};
    const helper = new LocalForageHelper(MARKET_CONTEXT_NAMESPACE);
    return helper.getState();
  }).then((state) => {
    storageStates.marketsState = state || {};
    const helper = new LocalForageHelper(MARKET_PRESENCES_CONTEXT_NAMESPACE);
    return helper.getState();
  }).then((state) => {
    storageStates.marketPresencesState = state || {};
    const helper = new LocalForageHelper(MARKET_STAGES_CONTEXT_NAMESPACE);
    return helper.getState();
  }).then((state) => {
    storageStates.marketStagesState = state || {};
    const helper = new LocalForageHelper(MARKET_GROUPS_CONTEXT_NAMESPACE);
    return helper.getState();
  }).then((state) => {
    storageStates.marketGroupsState = state ?? {};
    const helper = new LocalForageHelper(GROUP_MEMBERS_CONTEXT_NAMESPACE);
    return helper.getState();
  }).then((state) => {
    storageStates.groupMembersState = state ?? {};
    return storageStates;
  });
}

/**
 * Function that will make exactly one attempt to sync by adding to the promise chain
 * @returns {Promise<*>}
 */
export function doVersionRefresh() {
  console.info('Checking for sync');
  return getStorageStates().then((storageStates) => {
    return getChangedIds().then((audits) => {
      const foregroundList = [];
      const backgroundList = [];
      const inlineList = [];
      const fullList = [];
      const { marketsState } = storageStates;
      const failedSignatures = getFailedSignatures(marketsState) || [];
      const failedList = [];
      failedSignatures.forEach((fullSignature) => {
        const { id, unmatched: signatures } = fullSignature;
        const failedSignatures = [];
        signatures.forEach((signature) => {
          if (!checkSignatureInStorage(id, signature, storageStates)) {
            failedSignatures.push(signature);
            failedList.push(id);
          }
        });
        pushMessage(PUSH_MARKETS_CHANNEL, { event: SYNC_ERROR_EVENT, signature: {id,
            unmatched: failedSignatures} });
      });
      (audits || []).forEach((audit) => {
        const { signature, inline, active, id } = audit;
        fullList.push(id);
        if (!checkSignatureInStorage(id, signature, storageStates) || failedList.includes(id)) {
          if (inline) {
            inlineList.push(id);
          } else if (active) {
            foregroundList.push(id);
          } else {
            backgroundList.push(id);
          }
        }
      });
      // use the full list to calculate market's we're banned from
      pushMessage(REMOVED_MARKETS_CHANNEL, { event: BANNED_LIST, fullList });
      // Starting operation in progress just presents as a bug to the user because freezes all buttons so just log
      console.info('Beginning inline versions update');
      console.info(inlineList);
      const inlineMarketsStruct = {};
      return updateMarkets(inlineList, inlineMarketsStruct, MAX_CONCURRENT_API_CALLS, storageStates, true)
        .then(() => {
          sendMarketsStruct(inlineMarketsStruct);
          const foregroundMarketsStruct = {};
          console.info('Beginning foreground versions update');
          console.info(foregroundList);
          return updateMarkets(foregroundList, foregroundMarketsStruct, MAX_CONCURRENT_API_CALLS, storageStates)
              .then(() => {
              sendMarketsStruct(foregroundMarketsStruct);
              const backgroundMarketsStruct = {};
              console.info('Finished foreground update');
              refreshNotifications();
              console.info('Beginning background versions update');
              console.info(backgroundList);
              return updateMarkets(backgroundList, backgroundMarketsStruct, MAX_CONCURRENT_ARCHIVE_API_CALLS,
                storageStates).then(() => {
                  sendMarketsStruct(backgroundMarketsStruct);
                  console.info('Ending versions update');
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
 * @param storageStates
 * @returns {null}
 */
async function doRefreshMarket(marketId, componentSignatures, marketsStruct, storageStates) {
  const serverFetchSignatures = getFetchSignaturesForMarket(componentSignatures);
  const fromStorage = checkInStorage(marketId, serverFetchSignatures, storageStates);
  const { markets, comments, marketPresences, marketStages, investibles, marketGroups, groupMembers } = fromStorage;
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
  if (!_.isEmpty(marketGroups.unmatchedSignatures)) {
    chain = chain ? chain.then(() => fetchMarketGroups(marketId, marketGroups, marketsStruct))
      : fetchMarketGroups(marketId, marketGroups, marketsStruct);
  }
  if (!_.isEmpty(groupMembers.unmatchedSignatures)) {
    chain = chain ? chain.then(() => fetchGroupMembers(marketId, groupMembers, marketsStruct))
      : fetchGroupMembers(marketId, groupMembers, marketsStruct);
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
        pushMessage(PUSH_MARKETS_CHANNEL, { event: SYNC_ERROR_EVENT, signature: {id: marketId,
            unmatched: match.unmatchedSignatures} });
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
        pushMessage(PUSH_MARKETS_CHANNEL, { event: SYNC_ERROR_EVENT, signature: {id: marketId,
            unmatched: match.unmatchedSignatures} });
      }
    });
}

function fetchMarketInvestibles(marketId, allInvestibles, marketsStruct) {
  const investiblesSignatures = allInvestibles.unmatchedSignatures;
  // For now ignore any market info by itself signature - it will get matched up elsewhere
  const investibleSignaturesFiltered = investiblesSignatures.filter((sig) => sig.investible);
  const investibleIds = investibleSignaturesFiltered.map((inv) => inv.investible.id);
  return fetchInvestibles(investibleIds, marketId)
    .then((investibles) => {
      const match = signatureMatcher(investibles, investiblesSignatures);
      addMarketsStructInfo('investibles', marketsStruct, investibles);
      if (!match.allMatched) {
        console.warn(match.unmatchedSignatures);
        pushMessage(PUSH_MARKETS_CHANNEL, { event: SYNC_ERROR_EVENT, signature: {id: marketId,
            unmatched: match.unmatchedSignatures} });
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
        pushMessage(PUSH_MARKETS_CHANNEL, { event: SYNC_ERROR_EVENT, signature: {id: marketId,
            unmatched: match.unmatchedSignatures} });
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
        pushMessage(PUSH_MARKETS_CHANNEL, { event: SYNC_ERROR_EVENT, signature: {id: marketId,
            unmatched: match.unmatchedSignatures} });
      }
    });
}

function fetchMarketGroups(marketId, allMg, marketsStruct) {
  const mgSignatures = allMg.unmatchedSignatures;
  return getMarketGroups(marketId)
    .then((groups) => {
        const match = signatureMatcher(groups, mgSignatures);
        addMarketsStructInfo('group', marketsStruct, groups, marketId);
        if(!match.allMatched) {
          console.warn(match.unmatchedSignatures);
          pushMessage(PUSH_MARKETS_CHANNEL, { event: SYNC_ERROR_EVENT, signature: {id: marketId,
            unmatched: match.unmatchedSignatures
          }})
        }
    })
}

function fetchGroupMembers(marketId, allMg, marketsStruct) {
  const mgSignatures = allMg.unmatchedSignatures;
  const groupIds = [];
  mgSignatures.forEach((sign) => {
    if (!groupIds.includes(sign.group_id)) {
      groupIds.push(sign.group_id);
    }
  });
  return getGroupMembers(marketId, groupIds)
    .then((users) => {
      const match = signatureMatcher(users, mgSignatures);
      addMarketsStructInfo('members', marketsStruct, users);
      if(!match.allMatched) {
        console.warn(match.unmatchedSignatures);
        pushMessage(PUSH_MARKETS_CHANNEL, { event: SYNC_ERROR_EVENT, signature: {id: marketId,
            unmatched: match.unmatchedSignatures
          }})
      }
    })
}