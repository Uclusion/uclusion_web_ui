import { getClient } from '../../config/uclusionClient';
import { sendIntlMessage, ERROR, SUCCESS } from '../../utils/userMessage';
import { updateInChunks } from '../reducer_helpers';

export const COMMENTS_LIST_REQUESTED = 'COMMENTS_LIST_REQUESTED';
export const COMMENTS_LIST_RECEIVED = 'COMMENTS_LIST_RECEIVED';
export const COMMENTS_REQUESTED = 'COMMENTS_REQUESTED';
export const COMMENTS_RECEIVED = 'COMMENTS_RECEIVED';
export const COMMENT_CREATED = 'COMMENT_CREATED';
export const COMMENT_DELETED = 'COMMENT_DELETED';

export const commentDeleted = (investibleId, commentId) => ({
  type: COMMENT_DELETED,
  investibleId,
  commentId,
});

export const commentsRequested = (marketId, commentIds) => ({
  type: COMMENTS_REQUESTED,
  marketId,
  commentIds,
});

export const commentCreated = (marketId, comment) => ({
  type: COMMENT_CREATED,
  marketId,
  comments: [comment],
});

export const commentsReceived = (marketId, comments) => ({
  type: COMMENTS_RECEIVED,
  marketId,
  comments,
});

export const commentListRequested = (marketId) => ({
  type: COMMENTS_LIST_REQUESTED,
  marketId,
});

export const commentListReceived = (comments) => ({
  type: COMMENTS_LIST_RECEIVED,
  comments,
});

export const deleteComment = (params = {}) => (dispatch) => {
  const { commentId, investibleId} = params;
  const clientPromise = getClient();
  clientPromise.then((client) => {
    client.investibles.deleteComment(commentId)
      .then((result) => {
        dispatch(commentDeleted(investibleId, commentId));
        sendIntlMessage(SUCCESS, { id: 'commentDeleteSucceeded' });
      }).catch((error) => {
        console.error(error);
        sendIntlMessage(ERROR, { id: 'commentDeleteFailed' });
      });
  });
};

export const fetchComments = (params = {}) => (dispatch) => {
  const { commentIdList, marketId } = params;
  const clientPromise = getClient();
  return clientPromise.then(client => client.investibles.getMarketComments(marketId, commentIdList))
    .then((comments) => {
      dispatch(commentsReceived(marketId, comments));
    }).catch((error) => {
      console.error(error);
      sendIntlMessage(ERROR, { id: 'commentsFetchFailed' });
    });
};

export const fetchCommentList = (params = {}) => (dispatch) => {
  const { marketId, currentCommentList } = params;
  const clientPromise = getClient();
  console.debug('Fetching investibles list for:', marketId);
  return clientPromise.then(client => client.investibles.listCommentsByMarket(marketId))
    .then((commentList) => {
      updateInChunks(dispatch, currentCommentList, commentList.comments, fetchComments, marketId);
    }).catch((error) => {
      console.error(error);
      sendIntlMessage(ERROR, { id: 'commentsListFetchFailed' });
    });
};

export const createComment = (params = {}) => (dispatch) => {
  const { investibleId, body } = params;
  const clientPromise = getClient();
  clientPromise.then((client) => {
    client.investibles.createComment(investibleId, body)
      .then((comment) => {
        dispatch(commentCreated(comment));
        sendIntlMessage(SUCCESS, { id: 'commentCreateSucceeded' });
      }).catch((error) => {
        console.error(error);
        sendIntlMessage(ERROR, { id: 'commentCreateFailed' });
      });
  });
};
