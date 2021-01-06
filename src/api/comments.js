import _ from 'lodash'
import { getMarketClient } from './uclusionClient'
import { toastErrorAndThrow } from '../utils/userMessage'
import { AllSequentialMap } from '../utils/PromiseUtils'

// import { commentCreated, commentDeleted, commentsReceived } from '../store/Comments/actions';

export function fetchComments(idList, marketId) {
  const clientPromise = getMarketClient(marketId);
  const chunks = _.chunk(idList, 50);
  // // console.debug(idList);
  return clientPromise.then((client) => {
    return AllSequentialMap(chunks, (chunk) => {
      return client.investibles.getMarketComments(chunk);
    }).then((commentsLists) => _.flatten(commentsLists));
  }).catch((error) => toastErrorAndThrow(error, 'errorCommentFetchFailed'));
}

export function saveComment(marketId, investibleId, replyId, body, commentType, uploadedFiles, mentions, notificationType) {
  return getMarketClient(marketId)
    .then((client) => client.investibles.createComment(investibleId, body, replyId, commentType, uploadedFiles, mentions,
      notificationType))
    .catch((error) => toastErrorAndThrow(error, 'errorCommentSaveFailed'));
}

export function updateComment(marketId, commentId, body, commentType, uploadedFiles, mentions, notificationType) {
  return getMarketClient(marketId)
    .then((client) => client.investibles.updateComment(commentId, body, undefined, uploadedFiles, mentions, commentType,
      notificationType))
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

export function moveComments(marketId, investibleId, commentIds) {
  return getMarketClient(marketId)
    .then((client) => client.investibles.moveComments(investibleId, commentIds))
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
      mentions.push(span.getAttribute('data-id'));
    }
  }
  // dedupe, since people can be mentioned twice
  return _.uniq(mentions);
}