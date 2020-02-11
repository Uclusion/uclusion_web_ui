import _ from 'lodash';
import { getMarketClient } from './uclusionClient';
import { toastErrorAndThrow } from '../utils/userMessage';
import { JUSTIFY_TYPE } from '../constants/comments';
import { AllSequentialMap } from '../utils/PromiseUtils';

export function fetchInvestibles(idList, marketId) {
  const clientPromise = getMarketClient(marketId);
  // console.debug(idList);
  // console.debug(`Fetching idList ${idList}`);
  const chunks = _.chunk(idList, 50);
  return clientPromise.then((client) => {
    return AllSequentialMap(chunks, (idList) => client.markets.getMarketInvestibles(idList))
      .then((investibleLists) => _.flatten(investibleLists));
  }).catch((error) => toastErrorAndThrow(error, 'errorInvestibleFetchFailed'));
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
