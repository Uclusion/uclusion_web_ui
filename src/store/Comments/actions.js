import { getClient } from '../../config/uclusionClient';
import { sendIntlMessage, ERROR, SUCCESS } from '../../utils/userMessage';

export const COMMENTS_LIST_REQUESTED = 'COMMENTS_LIST_REQUESTED';
export const COMMENTS_LIST_RECEIVED = 'COMMENTS_LIST_RECEIVED';
export const COMMENT_REQUESTED = 'COMMENT_REQUESTED';
export const COMMENT_RECEIVED = 'COMMENT_RECEIVED';

export const commentRequested = (commentId) => ({
  type: COMMENT_REQUESTED,
  commentId,
});

export const commentReceived = (comment) => ({
  type: COMMENT_RECEIVED,
  comment,
});

export const commentListRequested = (investibleId) => ({
  type: COMMENTS_LIST_REQUESTED,
  investibleId
});

export const commentListReceived = (comments) => ({
  type: COMMENTS_LIST_RECEIVED,
  comments,
});

export const fetchComment = (params = {}) => (dispatch) =>  {
  const { commentId } = params;
  const clientPromise = getClient();
 /* clientPromise.then((client) => {
    client.investibles.
  })*/
};