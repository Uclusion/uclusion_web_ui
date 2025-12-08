import { getMarketClient } from './marketLogin'
import { fixupItemForStorage } from '../contexts/ContextUtils'
import { errorAndThrow, toastErrorAndThrow } from '../utils/userMessage'
import { INITIATIVE_TYPE, PLANNING_TYPE } from '../constants/markets'
import { getAccountClient } from './homeAccount';
import _ from 'lodash';
import { AllSequentialMap } from '../utils/PromiseUtils';

function fixupMarketForStorage(market) {
  const itemFixed = fixupItemForStorage(market);
  return {
    ...itemFixed,
  };
}

export function getMarketDetails(client) {
  return client.markets.get().then((market) => fixupMarketForStorage(market))
    .then((market) => {
        return {
          ...market,
          currentUserId: market.current_user_id,
        };
      });
}

export function updateGroup(props) {
  const { marketId, groupId, name, description, uploadedFiles, ticketSubCode, groupType, isPublic  } = props;
  const updateOptions = {}
  if (name) {
    updateOptions.name = name
  }
  if (description) {
    updateOptions.description = description
  }
  if (uploadedFiles) {
    updateOptions.uploaded_files = uploadedFiles
  }
  if (ticketSubCode) {
    updateOptions.ticket_sub_code = ticketSubCode.toString(10);
  }
  if (groupType !== undefined) {
    updateOptions.group_type = groupType;
  }
  if (isPublic !== undefined) {
    updateOptions.is_public = isPublic;
  }
  return getMarketClient(marketId)
    .then((client) => client.markets.updateGroup(groupId, updateOptions))
    .catch((error) => toastErrorAndThrow(error, 'errorGroupUpdateFailed'))
}

export function activateInactiveMarket(marketId, isActive) {
  const updateOptions = {
    market_stage: isActive ? 'Active' : 'Inactive'
  }
  return getMarketClient(marketId)
    .then((client) => client.markets.updateMarket(updateOptions))
    .catch((error) => toastErrorAndThrow(error, 'errorMarketUpdateFailed'))
}

export function updateMarket(marketId, name = null, investmentExpiration = null, allowMultiVote = null,
  isSinglePersonMode = null) {
  const updateOptions = {}
  if (name != null) {
    updateOptions.name = name
  }
  if (investmentExpiration != null) {
    updateOptions.investment_expiration = investmentExpiration
  }
  if (allowMultiVote !== null) {
    updateOptions.allow_multi_vote = allowMultiVote
  }
  if (isSinglePersonMode !== null) {
    updateOptions.is_single_person = isSinglePersonMode;
  }
  return getMarketClient(marketId)
    .then((client) => client.markets.updateMarket(updateOptions))
    .catch((error) => toastErrorAndThrow(error, 'errorMarketUpdateFailed'))
}

export function changeGroupParticipation(marketId, groupId, addressed){
  return getMarketClient(marketId)
    .then((client) => client.markets.followGroup(groupId, addressed))
    .catch((error) => toastErrorAndThrow(error, 'errorChangeToParticipantFailed'));
}

export function createInitiative(marketInfo, messageKey = 'errorInitiativeAddFailed') {
  const myInfo = {
    ...marketInfo,
    market_type: INITIATIVE_TYPE,
  };
  return getAccountClient()
    .then((client) => client.markets.createMarket(myInfo))
    .catch((error) => toastErrorAndThrow(error, messageKey));
}

export function createPlanning(marketInfo) {
  const myInfo = {
    ...marketInfo,
    market_type: PLANNING_TYPE,
  };
  return getAccountClient()
    .then((client) => client.markets.createMarket(myInfo))
    .catch((error) => toastErrorAndThrow(error, 'errorPlanningAddFailed'));
}

export function createGroup(marketId, groupInfo) {
  return getMarketClient(marketId)
    .then((client) => client.markets.createGroup(groupInfo))
    .catch((error) => toastErrorAndThrow(error, 'errorGroupAddFailed'));
}

export function updateStage(marketId, stageId, allowedInvestibles, daysVisible) {
  return getMarketClient(marketId)
    .then((client) => client.markets.updateStage(stageId, allowedInvestibles, daysVisible))
    .catch((error) => toastErrorAndThrow(error, 'errorUpdateStageFailed'));
}

export function marketAbstain(marketId, isAbstain=true) {
  return getMarketClient(marketId)
    .then((client) => client.markets.updateAbstain(isAbstain))
    .catch((error) => toastErrorAndThrow(error, 'errorUpdateAbstainFailed'));
}

// below called in hub messages, so difficult to decide when to toast a message
export function getMarketStages(signatures, client) {
  const chunks = _.chunk(signatures, 100);
  return AllSequentialMap(chunks, (chunk) => {
    return client.markets.listStages(chunk);
  }).then((stagesLists) => _.flatten(stagesLists))
    .catch((error) => errorAndThrow(error, 'errorStagesFetchFailed'));
}

export function getMarketGroups(signatures, client) {
  const chunks = _.chunk(signatures, 100);
  return AllSequentialMap(chunks, (chunk) => {
    return client.markets.listGroups(chunk);
  }).then((groupsLists) => _.flatten(groupsLists))
    .catch((error) => errorAndThrow(error, 'errorGroupFetchFailed'));
}

export function getInvestments(userId, signatures, client) {
  return client.markets.listInvestments(userId, signatures)
    .catch((error) => errorAndThrow(error, 'errorGroupMembersFetchFailed'));
}

export function getGroupMembers(signaturesHash, client) {
  const chunks = Object.keys(signaturesHash);
  return AllSequentialMap(chunks, (groupId) => {
    return client.markets.listGroupMembers(groupId, signaturesHash[groupId]);
  }).then((usersLists) => _.flatten(usersLists))
    .catch((error) => errorAndThrow(error, 'errorGroupMembersFetchFailed'));
}

export function getMarketUsers(signatures, client) {
  const chunks = _.chunk(signatures, 100);
  return AllSequentialMap(chunks, (chunk) => {
    return client.markets.listUsers(chunk);
  }).then((usersLists) => _.flatten(usersLists))
    .catch((error) => errorAndThrow(error, 'errorUsersFetchFailed'));
}
