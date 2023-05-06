import { getAccountClient, getMarketClient } from './uclusionClient'
import { fixupItemForStorage } from '../contexts/ContextUtils'
import { errorAndThrow, toastErrorAndThrow } from '../utils/userMessage'
import { INITIATIVE_TYPE, PLANNING_TYPE } from '../constants/markets'

function fixupMarketForStorage(market) {
  const itemFixed = fixupItemForStorage(market);
  return {
    ...itemFixed,
  };
}

export function getMarketDetails(marketId) {
  return getMarketClient(marketId)
    .then((client) => client.markets.get()
      .then((market) => fixupMarketForStorage(market))
      .then((market) => {
        return {
          ...market,
          currentUserId: market.current_user_id,
        };
      }));
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
  const { marketId, groupId, name, description, uploadedFiles, votesRequired, ticketSubCode } = props;
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
  if (votesRequired != null) {
    updateOptions.votes_required = votesRequired
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
export function getMarketStages(marketId) {
  return getMarketClient(marketId)
    .then((client) => client.markets.listStages());
}

export function getMarketGroups(marketId) {
  return getMarketClient(marketId)
    .then((client) => client.markets.listGroups());
}

export function getGroupMembers(marketId, groupIds) {
  return getMarketClient(marketId)
    .then((client) => client.markets.listGroupMembers(groupIds));
}

export function lockGroupForEdit(marketId, groupId, breakLock) {
  return getMarketClient(marketId)
    .then((client) => client.markets.lock(groupId, breakLock))
    .catch((error) => toastErrorAndThrow(error, 'errorEditLockFailed'));
}

export function unlockGroupForEdit(marketId, groupId) {
  return getMarketClient(marketId)
    .then((client) => client.markets.unlock(groupId))
}

export function getMarketUsers(marketId) {
  if (!marketId) {
    console.error('No marketId');
    throw new Error('NO MARKET ID');
  }
  return getMarketClient(marketId).then((client) => client.markets.listUsers())
    .catch((error) => errorAndThrow(error, 'errorUsersFetchFailed'));
}
