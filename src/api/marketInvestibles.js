import _ from 'lodash';
import { getMarketClient } from './uclusionClient';
import { toastErrorAndThrow } from '../utils/userMessage';
import { JUSTIFY_TYPE } from '../constants/comments';
import { AllSequentialMap } from '../utils/PromiseUtils';

export function fetchInvestibles(idList, marketId) {
  const clientPromise = getMarketClient(marketId);
  // // console.debug(idList);
  // // console.debug(`Fetching idList ${idList}`);
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

/**
 * This call returns structure that has
 * 1) what happened to the comment
 * 2) the new investment
 * What happened to the comment is either
 * 1) A new Comment
 * or
 * 2) Deletion
 * or
 * 3) Nothing
 *
 * @param updateInfo
 * @returns {*}
 */
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
            return client.investibles.deleteComment(currentReasonId)
              .then(() => {
                return { commentAction: 'DELETED', comment: { id: undefined } }
              });
          }
          return client.investibles.updateComment(currentReasonId, newReasonText, false, [])
            .then((comment) => {
              return {
                commentAction: 'UPDATED',
                comment,
              }
            });
        }
        return client.investibles.createComment(investibleId, newReasonText,
          undefined, JUSTIFY_TYPE, [])
          .then((comment) => {
            return {
              commentAction: 'CREATED',
              comment,
            };
          })
      }
      return {
        commentAction: 'NOOP',
        comment: { id: currentReasonId },
      };
    }).then((commentResult) => {
      const { comment } = commentResult;
      const { id: commentId } = comment; // everything correctly updates comment id
      return globalClient.markets.updateInvestment(investibleId, newQuantity,
        currentQuantity, commentId, maxBudget)
        .then((investmentResult) => {
          return {
            commentResult,
            investmentResult,
          };
        });
    }).catch((error) => toastErrorAndThrow(error, 'errorInvestmentUpdateFailed'));
}
