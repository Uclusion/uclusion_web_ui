import { getMarketClient } from './uclusionClient';

// import { commentCreated, commentDeleted, commentsReceived } from '../store/Comments/actions';

export function deleteComment(commentId, investibleId, marketId) {
  const clientPromise = getMarketClient(marketId);
  return clientPromise.then((client) => client.investibles.deleteComment(commentId));
}

export function fetchComments(idList, marketId) {
  const clientPromise = getMarketClient(marketId);
  // console.debug(idList);
  return clientPromise.then((client) => client.investibles.getMarketComments(idList));
}

export function fetchCommentList(marketId) {
  const clientPromise = getMarketClient(marketId);
  // console.debug(`Fetching comments list for: ${marketId}`);
  return clientPromise.then((client) => client.investibles.listCommentsByMarket());
}

export function saveComment(marketId, investibleId, replyId, body, commentType, uploadedFiles) {
  return getMarketClient(marketId)
    .then((client) => client.investibles.createComment(investibleId, body, replyId, commentType, uploadedFiles));
}
