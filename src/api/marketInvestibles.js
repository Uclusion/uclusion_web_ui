import { getMarketClient } from './uclusionClient';
import { toastErrorAndThrow } from '../utils/userMessage';
import { JUSTIFY_TYPE } from '../constants/comments';

export function fetchInvestibles(idList, marketId) {
  const clientPromise = getMarketClient(marketId);
  // console.debug(idList);
  // console.debug(`Fetching idList ${idList}`);
  return clientPromise.then((client) => client.markets.getMarketInvestibles(idList))
    .catch((error) => toastErrorAndThrow(error, 'investibleFetchFailed'));
}

export function fetchInvestibleList(marketId) {
  const clientPromise = getMarketClient(marketId);
  // console.debug(`Fetching investibles list for: ${marketId}`);
  return clientPromise.then((client) => client.markets.listInvestibles())
    .then((response) => {
      const { investibles } = response;
      return investibles;
    }).catch((error) => toastErrorAndThrow(error, 'investibleListFetchFailed'));
}

export function updateInvestment(updateInfo) {
  const {
    marketId,
    investibleId,
    newQuantity,
    currentQuantity,
    currentReasonId,
    newReasonText,
    reasonNeedsUpdate,
    maxBudget,
  } = updateInfo;

  return getMarketClient(marketId)
    .then((client) => client.markets.updateInvestment(investibleId, newQuantity, currentQuantity,
      null, maxBudget)
      .then((updateResult) => {
        if (reasonNeedsUpdate) {
          if (currentReasonId) {
            return client.investibles.updateComment(currentReasonId, newReasonText, false, [])
              .then(() => updateResult);
          }
          return client.investibles.createComment(investibleId, newReasonText, undefined,
            JUSTIFY_TYPE, [])
            .then(() => updateResult);
        }
        return updateResult;
      }))
    .catch((error) => toastErrorAndThrow(error, 'errorInvestmentUpdateFailed'));
}

export function submitToModerator(submitInfo) {
  const {
    marketId,
    investibleId,
    stageInfo,
  } = submitInfo;
  return getMarketClient(marketId)
    .then((client) => client.investibles.stateChange(investibleId, stageInfo))
    .catch((error) => toastErrorAndThrow(error, 'errorSubmitToModeratorFailed'));
}
