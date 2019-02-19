import { getClient } from '../../config/uclusionClient';
import { sendIntlMessage, ERROR, SUCCESS } from '../../utils/userMessage';

export const COMMENTS_LIST_REQUESTED = 'COMMENTS_LIST_REQUESTED';
export const COMMENTS_LIST_RECEIVED = 'COMMENTS_LIST_RECEIVED';
export const COMMENT_REQUESTED = 'COMMENT_REQUESTED';
export const COMMENT_RECEIVED = 'COMMENT_RECEIVED';
export const COMMENT_CREATED = 'COMMENT_CREATED';
export const COMMENT_DELETED = 'COMMENT_DELETED';

export const commentDeleted = (investibleId, commentId) => ({
  type: COMMENT_DELETED,
  investibleId,
  commentId,
});

export const commentRequested = (commentId) => ({
  type: COMMENT_REQUESTED,
  commentId,
});

export const commentCreated = (comment) => ({
  type: COMMENT_CREATED,
  comment,
});

export const commentReceived = (comment) => ({
  type: COMMENT_RECEIVED,
  comment,
});

export const commentListRequested = (investibleId) => ({
  type: COMMENTS_LIST_REQUESTED,
  investibleId,
});

export const commentListReceived = (comments) => ({
  type: COMMENTS_LIST_RECEIVED,
  comments,
});

export const deleteComment = (params = {}) => (dispatch) => {
  const { commentId, investibleId } = params;
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

export const fetchComment = (params = {}) => (dispatch) => {
  const { commentId } = params;
  const clientPromise = getClient();
  clientPromise.then((client) => {
    client.investibles.getComment(commentId)
      .then((comment) => {
        dispatch(commentReceived(comment));
      }).catch((error) => {
        console.error(error);
      });
  });
};

export const fetchCommentList = (params = {}) => (dispatch) => {
  const { investibleId } = params;
  const clientPromise = getClient();
  clientPromise.then((client) => {
    client.investibles.listComments(investibleId, 9999)
      .then((comments) => {
        dispatch(commentListReceived(comments));
      }).catch((error) => {
        alert(error);
        console.error(error);
        sendIntlMessage(ERROR, { id: 'commentsFetchFailed' });
      });
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
