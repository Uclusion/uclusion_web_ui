import { getAccountClient, getMarketClient } from './uclusionClient'
import { fixupItemForStorage } from '../contexts/ContextUtils'
import { toastErrorAndThrow } from '../utils/userMessage'
import { INITIATIVE_TYPE, PLANNING_TYPE, DECISION_TYPE, ACTIVE_STAGE, INACTIVE_STAGE } from '../constants/markets'

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

export function attachFilesToMarket(marketId, metadatas) {
  return getMarketClient(marketId)
    .then((client) => client.markets.addAttachments(metadatas))
    .catch((error) => toastErrorAndThrow(error, 'errorMarketAttachFilesFailed'));
}

export function deleteAttachedFilesFromMarket(marketId, files) {
  return getMarketClient(marketId)
    .then((client) => client.markets.deleteAttachments(files))
    .catch((error) => toastErrorAndThrow(error, 'errorMarketRemoveAttachedFilesFailed'));
}

export function updateMarket(marketId, name, description, uploadedFiles, maxBudget,
  investmentExpiration, daysEstimate, votesRequired, allowMultiVote, ticketSubCode) {
  const updateOptions = {};
  if (name != null) {
    updateOptions.name = name;
  }
  if (description != null) {
    updateOptions.description = description;
  }
  if (uploadedFiles != null) {
    updateOptions.uploaded_files = uploadedFiles;
  }
  if (maxBudget != null) {
    updateOptions.max_budget = maxBudget;
  }
  if (investmentExpiration != null) {
    updateOptions.investment_expiration = investmentExpiration;
  }
  if (daysEstimate != null) {
    updateOptions.days_estimate = daysEstimate;
  }
  if (votesRequired != null) {
    updateOptions.votes_required = votesRequired;
  }
  if (allowMultiVote !== null) {
    updateOptions.allow_multi_vote = allowMultiVote;
  }
  if (ticketSubCode !== null) {
    updateOptions.ticket_sub_code = ticketSubCode;
  }
  return getMarketClient(marketId)
    .then((client) => client.markets.updateMarket(updateOptions))
    .catch((error) => toastErrorAndThrow(error, 'errorMarketUpdateFailed'));
}


export function changeUserToParticipant(marketId){
  return getMarketClient(marketId)
    .then((client) => client.markets.followMarket(false))
    .catch((error) => toastErrorAndThrow(error, 'errorChangeToParticipantFailed'));
}

export function changeUserToObserver(marketId){
  return getMarketClient(marketId)
    .then((client) => client.markets.followMarket(true))
    .catch((error) => toastErrorAndThrow(error, 'errorChangeToObserverFailed'));
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

export function createDecision(marketInfo, messageKey = 'errorDecisionAddFailed') {
  const myInfo = {
    ...marketInfo,
    market_type: DECISION_TYPE,
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

export function showMarket(marketId) {
  return getMarketClient(marketId)
    .then((client) => client.markets.unhide())
    .catch((error) => toastErrorAndThrow(error, 'errorMarketShowFailed'))
}
export function hideMarket(marketId) {
  return getMarketClient(marketId)
    .then((client) => client.markets.hide())
    .catch((error) => toastErrorAndThrow(error, 'errorMarketHideFailed'));
}

export function archiveMarket(marketId, marketType) {
  const marketStage = marketType === PLANNING_TYPE ? INACTIVE_STAGE : 'Cancelled';
  const updateOptions = { market_stage: marketStage };
  return getMarketClient(marketId)
    .then((client) => client.markets.updateMarket(updateOptions))
    .catch((error) => toastErrorAndThrow(error, 'errorMarketArchiveFailed'));
}

export function activateMarket(marketId) {
  const updateOptions = { market_stage: ACTIVE_STAGE };
  return getMarketClient(marketId)
    .then((client) => client.markets.updateMarket(updateOptions))
    .catch((error) => toastErrorAndThrow(error, 'errorMarketActivateFailed'));
}

export function updateStage(marketId, stageId, allowedInvestibles, daysVisible) {
  return getMarketClient(marketId)
    .then((client) => client.markets.updateStage(stageId, allowedInvestibles, daysVisible))
    .catch((error) => toastErrorAndThrow(error, 'errorUpdateStageFailed'));
}

// below called in hub messages, so difficult to decide when to toast a message
export function getMarketStages(marketId) {
  return getMarketClient(marketId)
    .then((client) => client.markets.listStages());
}

export function lockPlanningMarketForEdit(marketId, breakLock) {
  return getMarketClient(marketId)
    .then((client) => client.markets.lock(breakLock))
    .catch((error) => toastErrorAndThrow(error, 'errorEditLockFailed'));
}

export function unlockPlanningMarketForEdit(marketId) {
  return getMarketClient(marketId)
    .then((client) => client.markets.unlock())
}

export function getMarketUsers(marketId) {
  if (!marketId) {
    console.error('No marketId');
    throw new Error('NO MARKET ID');
  }
  return getMarketClient(marketId).then((client) => client.markets.listUsers());
}
