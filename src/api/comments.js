import _ from 'lodash'
import { getMarketClient } from './marketLogin'
import { errorAndThrow, toastErrorAndThrow } from '../utils/userMessage'
import { AllSequentialMap } from '../utils/PromiseUtils'

export function fetchComments(signatures, client) {
  const chunks = _.chunk(signatures, 100);
    return AllSequentialMap(chunks, (chunk) => {
      return client.investibles.getMarketComments(chunk);
    }).then((commentsLists) => _.flatten(commentsLists))
      .catch((error) => errorAndThrow(error, 'errorCommentFetchFailed'));
}

export function saveComment(marketId, groupId, investibleId, replyId, body, commentType, uploadedFiles, mentions,
  notificationType, marketType, isRestricted, isSent, investibleLabel) {
  return getMarketClient(marketId)
    .then((client) => client.investibles.createComment(investibleId, groupId, body, replyId, commentType, uploadedFiles,
      mentions, notificationType, marketType, isRestricted, isSent, investibleLabel))
    .catch((error) => toastErrorAndThrow(error, 'errorCommentSaveFailed'));
}

export function sendComment(marketId, commentId, label) {
  return getMarketClient(marketId)
    .then((client) => client.investibles.updateComment(commentId, undefined, undefined,
      undefined, undefined, undefined, undefined, true, label))
    .catch((error) => toastErrorAndThrow(error, 'errorCommentSaveFailed'));
}

export function alterComment(marketId, commentId, notificationType) {
  return getMarketClient(marketId)
    .then((client) => client.investibles.alterComment(commentId, notificationType))
    .catch((error) => toastErrorAndThrow(error, 'errorCommentSaveFailed'));
}

export function updateComment(values) {
  const { marketId, commentId, body, commentType, uploadedFiles, mentions, notificationType,
    isSent, investibleLabel, allowMulti, isRestricted, inProgress } = values;
  return getMarketClient(marketId)
    .then((client) => client.investibles.updateComment(commentId, body, undefined, uploadedFiles, mentions,
      commentType, notificationType, isSent, investibleLabel, allowMulti, isRestricted, inProgress))
    .catch((error) => toastErrorAndThrow(error, 'errorCommentSaveFailed'));
}

export function resolveComment(marketId, commentId) {
  // comments don't have uploaded files, hence we don't need to worry about zeroing them out.
  // otherwise we'd need the full comment to resolve whether or not we're changing them
  return getMarketClient(marketId)
    .then((client) => client.investibles.updateComment(commentId, undefined, true, []))
    .catch((error) => toastErrorAndThrow(error, 'errorCommentResolveFailed'));
}

export function removeComment(marketId, commentId) {
  return getMarketClient(marketId)
    .then((client) => client.investibles.deleteComment(commentId))
    .catch((error) => toastErrorAndThrow(error, 'errorCommentDeleteFailed'));
}

export function moveComments(marketId, investibleId, commentIds, resolveCommentIds, taskCommentIds, suggestCommentIds) {
  return getMarketClient(marketId)
    .then((client) => client.investibles.moveComments(investibleId, commentIds, resolveCommentIds, taskCommentIds,
      suggestCommentIds))
    .catch((error) => toastErrorAndThrow(error, 'errorCommentMoveFailed'));
}

export function reopenComment(marketId, commentId) {
  // comments don't have uploaded files, hence we don't need to worry about zeroing them out.
  // otherwise we'd need the full comment to resolve whether or not we're changing them
  return getMarketClient(marketId)
    .then((client) => client.investibles.updateComment(commentId, undefined, false, []))
    .catch((error) => toastErrorAndThrow(error, 'errorCommentReopenFailed'));
}

export function getMentionsFromText(body) {
  const sandbox = document.createElement('div');
  sandbox.innerHTML = body;
  const spans = sandbox.getElementsByTagName('span');
  const mentions = [];
  // inspect all spans for the format we expect
  // which is with the data index, id, value, and denotation-char set
  for (let x = 0; x < spans.length; x += 1) {
    const span = spans[x]
    const isMention = span.hasAttribute('data-id') && span.hasAttribute('data-index')
      && span.hasAttribute('data-value') && span.hasAttribute('data-denotation-char');
    if (isMention){
      // the presence id is the data-id
      mentions.push(
        {
          user_id: span.getAttribute('data-id'),
          external_id: span.getAttribute('data-external-id'),
        });
    }
  }
  const dedupedObject = mentions.reduce((acc, currentMention) => {
    const { user_id } = currentMention;
    if (!acc[user_id]) {
      return {
        ...acc,
        [user_id]: currentMention
      };
    }
    return acc;
  }, {});
  return Object.values(dedupedObject);
}