import { getAccountClient, getMarketClient } from './uclusionClient';
import { fixupItemForStorage } from '../contexts/ContextUtils';
import { toastErrorAndThrow } from '../utils/userMessage';

function fixupMarketForStorage(market) {
  const itemFixed = fixupItemForStorage(market);
  const { created_at: createdAt, expiration_minutes: expirationMinutes } = itemFixed;
  const expirationMillis = createdAt.getTime() + (60000 * expirationMinutes);
  return {
    ...itemFixed,
    expires_at: expirationMillis,
  };
}

export function getMarketDetails(marketId) {
  return getMarketClient(marketId)
    .then((client) => client.markets.get()
      .then((market) => fixupMarketForStorage(market))
      .then((market) => client.users.get()
        .then((user) => ({
          ...market,
          currentUser: user,
        }))));
}

export function extendMarketExpiration(marketId, expiration_minutes) {
  const updateOptions = { expiration_minutes };
  return getMarketClient(marketId)
    .then((client) => client.markets.updateMarket(updateOptions))
    .catch((error) => toastErrorAndThrow(error, 'errorMarketExpirationExtendFailed'));
}

export function updateMarket(marketId, name, description, uploaded_files, maxBudget, investmentExpiration) {
  const updateOptions = { name, description, uploaded_files };
  if (maxBudget) {
    updateOptions.max_budget = maxBudget;
  }
  if (investmentExpiration) {
    updateOptions.investment_expiration = investmentExpiration;
  }
  // console.debug(`Updating market ${marketId}`);
  // console.debug(updateOptions);
  return getMarketClient(marketId)
    .then((client) => client.markets.updateMarket(updateOptions))
    .catch((error) => toastErrorAndThrow(error, 'errorMarketUpdateFailed'));
}

export function changeToObserver(marketId) {
  return getMarketClient(marketId)
    .then((client) => client.markets.followMarket(true))
    .catch((error) => toastErrorAndThrow(error, 'errorChangeToObserverFailed'));
}

export function changeToParticipant(marketId) {
  return getMarketClient(marketId)
    .then((client) => client.markets.followMarket(false))
    .catch((error) => toastErrorAndThrow(error, 'errorChangeToParticipantFailed'));
}

export function createDecision(marketInfo, messageKey = 'errorDecisionAddFailed') {
  return getAccountClient()
    .then((client) => client.markets.createMarket(marketInfo))
    .catch((error) => toastErrorAndThrow(error, messageKey));
}

export function createPlanning(marketInfo) {
  return getAccountClient()
    .then((client) => client.markets.createMarket(marketInfo))
    .catch((error) => toastErrorAndThrow(error, 'errorPlanningAddFailed'));
}

export function leaveMarket(marketId) {
  return getMarketClient(marketId)
    .then((client) => client.markets.hide())
    .catch((error) => toastErrorAndThrow(error, 'errorMarketLeaveFailed'));
}

export function archiveMarket(marketId) {
  const updateOptions = { market_stage: 'Inactive' };
  return getMarketClient(marketId)
    .then((client) => client.markets.updateMarket(updateOptions))
    .catch((error) => toastErrorAndThrow(error, 'errorMarketArchiveFailed'));
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
    .catch((error) => toastErrorAndThrow(error, 'errorEditLockReleaseFailed'));
}

export function getMarketUsers(marketId) {
  if (!marketId) {
    console.error('No marketId');
    throw new Error('NO MARKET ID');
  }
  return getMarketClient(marketId)
    .then((client) => client.users.get() // this is me
      .then((user) => client.markets.listUsers()
        .then((presences) => presences.map((presence) => {
          if (presence.id === user.id) {
            return { ...presence, current_user: true };
          }
          return presence;
        }))));
}
