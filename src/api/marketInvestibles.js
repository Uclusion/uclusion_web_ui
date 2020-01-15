import _ from 'lodash';
import { getMarketClient } from './uclusionClient';
import { toastErrorAndThrow } from '../utils/userMessage';
import { JUSTIFY_TYPE } from '../constants/comments';

export function fetchInvestibles(idList, marketId) {
  const clientPromise = getMarketClient(marketId);
  // console.debug(idList);
  // console.debug(`Fetching idList ${idList}`);
  return clientPromise.then((client) => client.markets.getMarketInvestibles(idList))
    .catch((error) => toastErrorAndThrow(error, 'errorInvestibleFetchFailed'));
}

export function fetchInvestibleList(marketId) {
  const clientPromise = getMarketClient(marketId);
  // console.debug(`Fetching investibles list for: ${marketId}`);
  return clientPromise.then((client) => client.markets.listInvestibles())
    .then((response) => {
      const { investibles } = response;
      return investibles;
    }).catch((error) => toastErrorAndThrow(error, 'errorInvestibleListFetchFailed'));
}

export function removeInvestment(marketId, investibleId) {
  return getMarketClient(marketId)
    .then((client) => client.markets.removeInvestment(investibleId))
    .catch((error) => toastErrorAndThrow(error, 'errorInvestmentUpdateFailed'));
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
  let globalClient;
  return getMarketClient(marketId)
    .then((client) => {
      globalClient = client;
      if (reasonNeedsUpdate) {
        if (currentReasonId) {
          if (_.isEmpty(newReasonText)) {
            return client.investibles.deleteComment(currentReasonId);
          }
          return client.investibles.updateComment(currentReasonId, newReasonText, false, []);
        }
        return client.investibles.createComment(investibleId, newReasonText,
          undefined, JUSTIFY_TYPE, []);
      }
      return { id: currentReasonId };
    }).then((comment) => {
      const { id } = comment;
      return globalClient.markets.updateInvestment(investibleId, newQuantity,
        currentQuantity, id, maxBudget);
    }).catch((error) => toastErrorAndThrow(error, 'errorInvestmentUpdateFailed'));
}
