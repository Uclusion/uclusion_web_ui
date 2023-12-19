import { getMarketClient } from './marketLogin'
import { fixupItemForStorage } from '../contexts/ContextUtils'
import { errorAndThrow, toastErrorAndThrow } from '../utils/userMessage'
import { INITIATIVE_TYPE, PLANNING_TYPE } from '../constants/markets'
import { getAccountClient } from './homeAccount';

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

export function manageMarket(marketId, expirationMinutes) {
  const updateOptions = { };
  if (expirationMinutes !== undefined) {
    updateOptions.expiration_minutes = expirationMinutes;
  }
  return getMarketClient(marketId)
    .then((client) => client.markets.updateMarket(updateOptions))
    .catch((error) => toastErrorAndThrow(error, 'errorMarketExpirationExtendFailed'));
}

export function attachFilesToGroup(marketId, groupId, metadatas) {
  return getMarketClient(marketId)
    .then((client) => client.markets.addAttachments(groupId, metadatas))
    .catch((error) => toastErrorAndThrow(error, 'errorMarketAttachFilesFailed'));
}

export function deleteAttachedFilesFromMarket(marketId, files) {
  return getMarketClient(marketId)
    .then((client) => client.markets.deleteAttachments(files))
    .catch((error) => toastErrorAndThrow(error, 'errorMarketRemoveAttachedFilesFailed'));
}

export function updateGroup(props) {
  const { marketId, groupId, name, description, uploadedFiles, ticketSubCode } = props;
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
  return getMarketClient(marketId)
    .then((client) => client.markets.updateGroup(groupId, updateOptions))
    .catch((error) => toastErrorAndThrow(error, 'errorGroupUpdateFailed'))
}

export function updateMarket(marketId, name = null, investmentExpiration = null, allowMultiVote = null) {
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

export function marketAbstain(marketId) {
  return getMarketClient(marketId)
    .then((client) => client.markets.updateAbstain(true))
    .catch((error) => toastErrorAndThrow(error, 'errorUpdateAbstainFailed'));
}

// below called in hub messages, so difficult to decide when to toast a message
export function getMarketStages(client) {
  return client.markets.listStages()
    .catch((error) => errorAndThrow(error, 'errorStagesFetchFailed'));
}

export function getMarketGroups(client) {
  return client.markets.listGroups().catch((error) => errorAndThrow(error, 'errorGroupFetchFailed'));
}

export function getGroupMembers(client, groupIds) {
  return client.markets.listGroupMembers(groupIds)
    .catch((error) => errorAndThrow(error, 'errorGroupMembersFetchFailed'));
}

export function getMarketUsers(client) {
  return client.markets.listUsers().catch((error) => errorAndThrow(error, 'errorUsersFetchFailed'));
}
