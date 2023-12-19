import _ from 'lodash'
import { pushMessage } from '../utils/MessageBusUtils'
import { getChangedIds, getVersions } from './summaries'
import { getGroupMembers, getMarketDetails, getMarketGroups, getMarketStages, getMarketUsers } from './markets'
import { getFetchSignaturesForMarket, signatureMatcher, } from './versionSignatureUtils'
import { fetchComments } from './comments'
import { fetchInvestibles } from './marketInvestibles'
import { LimitedParallelMap } from '../utils/PromiseUtils'
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
import { RepeatingFunction } from '../utils/RepeatingFunction';
import { MAX_DRIFT_TIME } from '../contexts/WebSocketContext';
import { isSignedOut } from '../utils/userFunctions';
import { getMarketClient } from './marketLogin';

const MAX_RETRIES = 10;
const MAX_CONCURRENT_API_CALLS = 5;
const MAX_CONCURRENT_ARCHIVE_API_CALLS = 1;
export const NOTIFICATIONS_HUB_CHANNEL = 'NotificationsChannel';
export const NOTIFICATIONS_HUB_CONTROL_PLANE_CHANNEL = 'NotificationsChannelControlPlane';
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
export const DEMO_EVENT = 'demo_loaded';
export const LOGIN_EVENT = 'user_logged_in';
export class MatchError extends Error {}

let runner;
const matchErrorHandlingVersionRefresh = () => {
  return doVersionRefresh()
    .catch((error) => {
      console.error(error);
      // we'll log match problems, but raise the rest
      if (error instanceof MatchError) {
        console.info('Ignoring match error');
      } else {
        throw(error);
      }
    });
};
export function startRefreshRunner() {
  runner = new RepeatingFunction(matchErrorHandlingVersionRefresh, MAX_DRIFT_TIME, MAX_RETRIES);
  return runner.start();
}

/**
 * If ignoreIfInProgress is false, then will execute a single version refresh.
 * Otherwise, will start up a refreshRunner or if it's already started do nothing
 * @param ignoreIfInProgress
 * @returns {Promise<*>}
 */
export function refreshVersions (ignoreIfInProgress=false) {
  if (isSignedOut()) {
    return Promise.resolve(true); // also do nothing when signed out
  }
  if (!ignoreIfInProgress) {
    return matchErrorHandlingVersionRefresh();
  } else {
    if (runner == null){
      return startRefreshRunner();
    } else {
      return Promise.resolve(true); // do nothing
    }
  }
}

export function refreshNotifications () {
  if (!isSignedOut()) {
    // check if new notifications
    pushMessage(NOTIFICATIONS_HUB_CHANNEL, { event: VERSIONS_EVENT });
  }
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
  console.info("Updating with markets struct");
  console.info(marketsStruct)
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
 * Function that will make exactly one attempt to sync
 * @returns {Promise<*>}
 */
export async function doVersionRefresh() {
  console.info('Checking for sync');
  const storageStates = await getStorageStates();
  const audits = await getChangedIds();
  const foregroundList = [];
  const backgroundList = [];
  const bannedList = [];
  const inlineList = [];
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
    pushMessage(PUSH_MARKETS_CHANNEL, {
      event: SYNC_ERROR_EVENT, signature: {
        id,
        unmatched: failedSignatures
      }
    });
  });
  (audits || []).forEach((audit) => {
    const { signature, inline, active, banned, id } = audit;
    if (!checkSignatureInStorage(id, signature, storageStates) || failedList.includes(id)) {
      if (inline) {
        inlineList.push(id);
      } else if (active) {
        foregroundList.push(id);
      } else if (banned) {
        bannedList.push(id);
      } else {
        backgroundList.push(id);
      }
    }
  });
  pushMessage(REMOVED_MARKETS_CHANNEL, { event: BANNED_LIST, bannedList });
  // Starting operation in progress just presents as a bug to the user because freezes all buttons so just log
  console.info('Beginning inline versions update');
  console.info(inlineList);
  // TODO: this is evil. We're using the inlineMarketsStruct as an _output_ parameter that gets mutated
  const inlineMarketsStruct = {};
  await updateMarkets(inlineList, inlineMarketsStruct, MAX_CONCURRENT_API_CALLS, storageStates, true)
  sendMarketsStruct(inlineMarketsStruct);
  const foregroundMarketsStruct = {};
  console.info('Beginning foreground versions update');
  console.info(foregroundList);
  // TODO: Again, this is evil. ForegroundMarketsStruct is an _output_ parameter that gets mutated
  await updateMarkets(foregroundList, foregroundMarketsStruct, MAX_CONCURRENT_API_CALLS, storageStates);
  sendMarketsStruct(foregroundMarketsStruct);
  const backgroundMarketsStruct = {};
  console.info('Finished foreground update');
  refreshNotifications();
  console.info('Beginning background versions update');
  console.info(backgroundList);
  await updateMarkets(backgroundList, backgroundMarketsStruct, MAX_CONCURRENT_ARCHIVE_API_CALLS, storageStates);
  sendMarketsStruct(backgroundMarketsStruct);
  console.info('Ending versions update');
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
  const promises = [];
  const marketClient = await getMarketClient(marketId);
  if (!_.isEmpty(markets.unmatchedSignatures)) {
    // can only be one :)
    promises.push(fetchMarketVersion(marketClient, marketId, markets.unmatchedSignatures[0], marketsStruct));
  }
  if (!_.isEmpty(comments.unmatchedSignatures)) {
    promises.push(fetchMarketComments(marketClient, marketId, comments, marketsStruct));
  }
  if (!_.isEmpty(investibles.unmatchedSignatures)) {
    promises.push(fetchMarketInvestibles(marketClient, marketId, investibles, marketsStruct));
  }
  if (!_.isEmpty(marketPresences.unmatchedSignatures)) {
    promises.push(fetchMarketPresences(marketClient, marketId, marketPresences, marketsStruct));
  }
  if (!_.isEmpty(marketStages.unmatchedSignatures)) {
    promises.push(fetchMarketStages(marketClient, marketId, marketStages, marketsStruct));
  }
  if (!_.isEmpty(marketGroups.unmatchedSignatures)) {
    promises.push(fetchMarketGroups(marketClient, marketId, marketGroups, marketsStruct));
  }
  if (!_.isEmpty(groupMembers.unmatchedSignatures)) {
    promises.push(fetchGroupMembers(marketClient, marketId, groupMembers, marketsStruct));
  }
  return LimitedParallelMap(promises, (promise) => promise, MAX_CONCURRENT_API_CALLS);
}

function fetchMarketVersion (marketClient, marketId, marketSignature, marketsStruct) {
  return getMarketDetails(marketClient)
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

function fetchMarketComments (marketClient, marketId, allComments, marketsStruct) {
  const commentsSignatures = allComments.unmatchedSignatures;
  const commentIds = commentsSignatures.map((comment) => comment.id);
  return fetchComments(commentIds, marketClient)
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

function fetchMarketInvestibles(marketClient, marketId, allInvestibles, marketsStruct) {
  const investiblesSignatures = allInvestibles.unmatchedSignatures;
  // For now ignore any market info by itself signature - it will get matched up elsewhere
  const investibleSignaturesFiltered = investiblesSignatures.filter((sig) => sig.investible);
  const investibleIds = investibleSignaturesFiltered.map((inv) => inv.investible.id);
  return fetchInvestibles(investibleIds, marketClient)
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

function fetchMarketPresences(marketClient, marketId, allMp, marketsStruct) {
  const mpSignatures = allMp.unmatchedSignatures;
  return getMarketUsers(marketClient)
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

function fetchMarketStages(marketClient, marketId, allMs, marketsStruct) {
  const msSignatures = allMs.unmatchedSignatures;
  return getMarketStages(marketClient)
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

function fetchMarketGroups(marketClient, marketId, allMg, marketsStruct) {
  const mgSignatures = allMg.unmatchedSignatures;
  return getMarketGroups(marketClient)
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

function fetchGroupMembers(marketClient, marketId, allMg, marketsStruct) {
  const mgSignatures = allMg.unmatchedSignatures;
  const groupIds = [];
  mgSignatures.forEach((sign) => {
    if (!groupIds.includes(sign.group_id)) {
      groupIds.push(sign.group_id);
    }
  });
  return getGroupMembers(marketClient, groupIds)
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