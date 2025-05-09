import _ from 'lodash'
import { pushMessage } from '../utils/MessageBusUtils'
import { getChangedIds, getVersions } from './summaries'
import {
  getGroupMembers,
  getInvestments,
  getMarketDetails,
  getMarketGroups,
  getMarketStages,
  getMarketUsers
} from './markets';
import { getFetchSignaturesForMarket } from './versionSignatureUtils'
import { fetchComments } from './comments'
import { fetchInvestibles } from './marketInvestibles'
import { LimitedParallelMap } from '../utils/PromiseUtils'
import {
  checkInStorage,
  checkSignatureInStorage,
} from './storageIntrospector';
import LocalForageHelper from '../utils/LocalForageHelper'
import { COMMENTS_CONTEXT_NAMESPACE, commentsContextHack } from '../contexts/CommentsContext/CommentsContext';
import { investibleContextHack, INVESTIBLES_CONTEXT_NAMESPACE } from '../contexts/InvestibesContext/InvestiblesContext';
import { MARKET_CONTEXT_NAMESPACE, marketsContextHack } from '../contexts/MarketsContext/MarketsContext';
import {
  MARKET_PRESENCES_CONTEXT_NAMESPACE,
  marketPresencesContextHack
} from '../contexts/MarketPresencesContext/MarketPresencesContext';
import {
  MARKET_STAGES_CONTEXT_NAMESPACE,
  marketStagesContextHack
} from '../contexts/MarketStagesContext/MarketStagesContext';
import {
  MARKET_GROUPS_CONTEXT_NAMESPACE,
  marketGroupsContextHack
} from '../contexts/MarketGroupsContext/MarketGroupsContext';
import {
  GROUP_MEMBERS_CONTEXT_NAMESPACE,
  groupMembersContextHack
} from '../contexts/GroupMembersContext/GroupMembersContext';
import { RepeatingFunction } from '../utils/RepeatingFunction';
import { MAX_DRIFT_TIME } from '../contexts/WebSocketContext';
import { isSignedOut } from '../utils/userFunctions';
import { getMarketClient } from './marketLogin';
import { TOKEN_TYPE_MARKET } from './tokenConstants';
import TokenStorageManager from '../authorization/TokenStorageManager';
import { addMarketsToStorage } from '../contexts/MarketsContext/marketsContextHelper';
import { addCommentsOther } from '../contexts/CommentsContext/commentsContextMessages';
import { updateCommentsFromVersions } from '../contexts/CommentsContext/commentsContextReducer';
import { refreshInvestibles } from '../contexts/InvestibesContext/investiblesContextHelper';
import { versionsUpdateMarketPresences } from '../contexts/MarketPresencesContext/marketPresencesContextReducer';
import { updateMarketStagesFromNetwork } from '../contexts/MarketStagesContext/marketStagesContextReducer';
import { addGroupsToStorage } from '../contexts/MarketGroupsContext/marketGroupsContextHelper';
import { versionsUpdateGroupMembers } from '../contexts/GroupMembersContext/groupMembersContextReducer';
import { leaderContextHack } from '../contexts/LeaderContext/LeaderContext';

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
export class MatchError extends Error {}

let runner;
const matchErrorHandlingVersionRefresh = (dispatchers=undefined) => {
  return navigator.locks.request("REFRESH_LOCK", {ifAvailable: true},
    async (aLock) => {
    if (aLock) {
      return doVersionRefresh(dispatchers)
        .catch((error) => {
          if (error instanceof MatchError) {
            // just log match problems
            console.info('Ignoring match error');
            console.info(error);
          } else {
            // Nowhere to raise this to so just put out as error
            console.info('doVersionRefresh error');
            console.error(error);
          }
        });
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
 * @param dispatchers
 * @returns {Promise<*>}
 */
export function refreshVersions (dispatchers=undefined) {
  const { isLeader } = leaderContextHack;
  // Do not refresh till know if leader cause won't know if storing to disk or not
  if (isSignedOut() || isLeader === undefined) {
    console.info(`Not refreshing with is leader ${isLeader}`)
    return Promise.resolve(true); // also do nothing when signed out
  }
  return matchErrorHandlingVersionRefresh(true, dispatchers).then(() => {
    // If missing always start a runner so max drift is honored
    if (runner == null){
      return startRefreshRunner();
    }
  });
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
      return new LimitedParallelMap(marketSignatures, (marketSignature) => {
        //console.error("MarketSignature")
        //console.error(marketSignature);
        const { market_id: marketId, signatures: componentSignatures } = marketSignature;
        return doRefreshMarket(marketId, componentSignatures, marketsStruct, storageStates);
      }, maxConcurrentCount);
    });
}

export function sendMarketsStruct(marketsStruct, dispatchers) {
  console.info('Updating with markets struct');
  const { marketsDispatch, marketStagesDispatch, groupsDispatch, presenceDispatch, groupMembersDispatch,
    investiblesDispatch, commentsDispatch, diffDispatch, index, ticketsDispatch } = dispatchers || {};
  if (marketsStruct['markets']) {
    console.info(marketsStruct['markets']);
    if (marketsDispatch) {
      addMarketsToStorage(marketsDispatch, marketsStruct['markets']);
    } else {
      pushMessage(PUSH_MARKETS_CHANNEL, { event: VERSIONS_EVENT, marketDetails: marketsStruct['markets'] });
    }
  }
  if (marketsStruct['comments']) {
    if (commentsDispatch) {
      let allComments = [];
      Object.values(marketsStruct['comments']).forEach((comments) => allComments = allComments.concat(comments));
      console.info(`Processing comments length ${allComments.length}`);
      addCommentsOther(commentsDispatch, diffDispatch, index, ticketsDispatch, allComments);
      console.info(`Dispatching comments with existing length ${marketsStruct['existingCommentIds']?.length}`);
      commentsDispatch(updateCommentsFromVersions(marketsStruct['comments'], marketsStruct['existingCommentIds']));
    } else {
      console.info('Pushing comments struct');
      pushMessage(PUSH_COMMENTS_CHANNEL, {
        event: VERSIONS_EVENT, commentDetails: marketsStruct['comments'],
        existingCommentIds: marketsStruct['existingCommentIds']
      });
    }
  }
  if (marketsStruct['investibles']) {
    console.info(marketsStruct['investibles']);
    if (investiblesDispatch) {
      refreshInvestibles(investiblesDispatch, diffDispatch, marketsStruct['investibles'], true);
    } else {
      pushMessage(PUSH_INVESTIBLES_CHANNEL, { event: VERSIONS_EVENT,
        investibles: marketsStruct['investibles'] });
    }
  }
  if (marketsStruct['users']) {
    console.info(marketsStruct['users']);
    if (presenceDispatch) {
      presenceDispatch(versionsUpdateMarketPresences(marketsStruct['users']));
    } else {
      pushMessage(PUSH_PRESENCE_CHANNEL, { event: VERSIONS_EVENT, userDetails: marketsStruct['users'] });
    }
  }
  if (marketsStruct['stages']) {
    console.info(marketsStruct['stages']);
    if (marketStagesDispatch) {
      marketStagesDispatch(updateMarketStagesFromNetwork(marketsStruct['stages']));
    } else {
      pushMessage(PUSH_STAGE_CHANNEL, { event: VERSIONS_EVENT, stageDetails: marketsStruct['stages'] });
    }
  }
  if (marketsStruct['group']) {
    console.info(marketsStruct['group']);
    if (groupsDispatch) {
      addGroupsToStorage(groupsDispatch, marketsStruct['group']);
    } else {
      pushMessage(PUSH_GROUPS_CHANNEL, { event: VERSIONS_EVENT, groupDetails: marketsStruct['group'] });
    }
  }
  if (marketsStruct['members']) {
    console.info(marketsStruct['members']);
    if (groupMembersDispatch) {
      groupMembersDispatch(versionsUpdateGroupMembers(marketsStruct['members']));
    } else {
      pushMessage(PUSH_MEMBER_CHANNEL, { event: VERSIONS_EVENT, memberDetails: marketsStruct['members'] });
    }
  }
}

function addMarketsStructInfo(infoType, marketsStruct, details, marketId) {
  if (_.isEmpty(details)) {
    return;
  }
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
  // Reloading comments and investibles from disk will take up too much memory and confuse leader strategy
  // So local forage helper will use the memory pointer if it is initialized
  const helper = new LocalForageHelper(COMMENTS_CONTEXT_NAMESPACE);
  return helper.getState(commentsContextHack).then((state) => {
    storageStates.commentsState = state || {};
    const helper = new LocalForageHelper(INVESTIBLES_CONTEXT_NAMESPACE);
    return helper.getState(investibleContextHack);
  }).then((state) => {
    storageStates.investiblesState = state || {};
    const helper = new LocalForageHelper(MARKET_CONTEXT_NAMESPACE);
    return helper.getState(marketsContextHack);
  }).then((state) => {
    storageStates.marketsState = state || {};
    const helper = new LocalForageHelper(MARKET_PRESENCES_CONTEXT_NAMESPACE);
    return helper.getState(marketPresencesContextHack);
  }).then((state) => {
    storageStates.marketPresencesState = state || {};
    const helper = new LocalForageHelper(MARKET_STAGES_CONTEXT_NAMESPACE);
    return helper.getState(marketStagesContextHack);
  }).then((state) => {
    storageStates.marketStagesState = state || {};
    const helper = new LocalForageHelper(MARKET_GROUPS_CONTEXT_NAMESPACE);
    return helper.getState(marketGroupsContextHack);
  }).then((state) => {
    storageStates.marketGroupsState = state ?? {};
    const helper = new LocalForageHelper(GROUP_MEMBERS_CONTEXT_NAMESPACE);
    return helper.getState(groupMembersContextHack);
  }).then((state) => {
    storageStates.groupMembersState = state ?? {};
    return storageStates;
  });
}

/**
 * Function that will make exactly one attempt to sync
 * @returns {Promise<*>}
 */
export async function doVersionRefresh(dispatchers) {
  console.info('Checking for sync');
  const storageStates = await getStorageStates();
  const audits = await getChangedIds();
  const foregroundList = [];
  const backgroundList = [];
  const bannedList = [];
  const inlineList = [];
  const bannedPromises = [];
  (audits || []).forEach((audit) => {
    const { signature, inline, active, banned, id } = audit;
    if (!checkSignatureInStorage(id, signature, storageStates, true)) {
      if (banned) {
        bannedList.push(id);
        const tokenStorageManager = new TokenStorageManager();
        bannedPromises.push(tokenStorageManager.deleteToken(TOKEN_TYPE_MARKET, id));
      }else if (inline) {
        inlineList.push(id);
      } else if (active) {
        foregroundList.push(id);
      } else {
        backgroundList.push(id);
      }
    }
  });
  // These banned audits might be processed over and over but for now that's cheap so allow
  pushMessage(REMOVED_MARKETS_CHANNEL, { event: BANNED_LIST, bannedList });
  await Promise.all(bannedPromises);
  // Starting operation in progress just presents as a bug to the user because freezes all buttons so just log
  console.info('Beginning inline versions update');
  console.info(inlineList);
  // TODO: this is evil. We're using the inlineMarketsStruct as an _output_ parameter that gets mutated
  const inlineMarketsStruct = {};
  await updateMarkets(inlineList, inlineMarketsStruct, MAX_CONCURRENT_API_CALLS, storageStates, true)
  sendMarketsStruct(inlineMarketsStruct, dispatchers);
  const foregroundMarketsStruct = {};
  console.info('Beginning foreground versions update');
  console.info(foregroundList);
  // TODO: Again, this is evil. ForegroundMarketsStruct is an _output_ parameter that gets mutated
  await updateMarkets(foregroundList, foregroundMarketsStruct, MAX_CONCURRENT_API_CALLS, storageStates);
  sendMarketsStruct(foregroundMarketsStruct, dispatchers);
  const backgroundMarketsStruct = {};
  console.info('Finished foreground update');
  refreshNotifications();
  console.info('Beginning background versions update');
  console.info(backgroundList);
  await updateMarkets(backgroundList, backgroundMarketsStruct, MAX_CONCURRENT_ARCHIVE_API_CALLS, storageStates);
  sendMarketsStruct(backgroundMarketsStruct, dispatchers);
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
  if (!marketClient) {
    return promises;
  }
  if (!_.isEmpty(markets.unmatchedSignatures)) {
    // can only be one :)
    promises.push(fetchMarketVersion(marketClient, marketId, marketsStruct));
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
  return new LimitedParallelMap(promises, (promise) => promise, MAX_CONCURRENT_API_CALLS);
}

function fetchMarketVersion(marketClient, marketId, marketsStruct) {
  // No need to pass signatures here as it's already a consistent read
  return getMarketDetails(marketClient)
    .then((marketDetails) => {
      // we bothered to fetch the data, so we should use it:)
      addMarketsStructInfo('markets', marketsStruct, [marketDetails]);
    });
}

function fetchMarketComments(marketClient, marketId, allComments, marketsStruct) {
  // This call already has signatures for parent reply added if necessary
  return fetchComments(allComments.unmatchedSignatures, marketClient)
    .then((comments) => {
      // Versions will be correct because they were sent down and consistent read done if not matching
      // Anything not returned is just missing from the DB for now
      addMarketsStructInfo('comments', marketsStruct, comments, marketId);
      marketsStruct['existingCommentIds'] = allComments.existingCommentIds;
    });
}

function fetchMarketInvestibles(marketClient, marketId, allInvestibles, marketsStruct) {
  return fetchInvestibles(allInvestibles.unmatchedSignatures, marketClient)
    .then((investibles) => {
      addMarketsStructInfo('investibles', marketsStruct, investibles);
    });
}

function fetchMarketPresences(marketClient, marketId, allMp, marketsStruct) {
  const userSignatures = allMp.unmatchedSignatures.map(signature => {
    return {id: signature.id, version: signature.market_capability_version};
  });
  return getMarketUsers(userSignatures, marketClient)
    .then((users) => {
      const promises = [];
      users.forEach((user) => {
        const userRawSignature = allMp.unmatchedSignatures.find(signature => signature.id === user.id);
        const investmentSignatures = userRawSignature.investments;
        if (!_.isEmpty(investmentSignatures)) {
          promises.push(getInvestments(user.id, investmentSignatures, marketClient).then((investments) => {
            user.investments = investments;
          }));
        }
      });
      return new LimitedParallelMap(promises, (promise) => promise, MAX_CONCURRENT_API_CALLS)
        .then(() => addMarketsStructInfo('users', marketsStruct, users, marketId));
    });
}

function fetchMarketStages(marketClient, marketId, allMs, marketsStruct) {
  return getMarketStages(allMs.unmatchedSignatures, marketClient)
    .then((stages) => {
      addMarketsStructInfo('stages', marketsStruct, stages, marketId);
    });
}

function fetchMarketGroups(marketClient, marketId, allMg, marketsStruct) {
  return getMarketGroups(allMg.unmatchedSignatures, marketClient)
    .then((groups) => {
        addMarketsStructInfo('group', marketsStruct, groups, marketId);
    })
}

function fetchGroupMembers(marketClient, marketId, allMg, marketsStruct) {
  const mgSignatures = allMg.unmatchedSignatures;
  const signaturesByGroupId = {};
  mgSignatures.forEach((sign) => {
    const groupId = sign.group_id;
    if (!signaturesByGroupId[groupId]) {
      signaturesByGroupId[groupId] = [];
    }
    signaturesByGroupId[groupId].push({id: sign.id, version: sign.version});
  });
  return getGroupMembers(signaturesByGroupId, marketClient)
    .then((users) => {
      addMarketsStructInfo('members', marketsStruct, users);
    })
}