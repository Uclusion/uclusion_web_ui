export const COMMENTS_LIST_REQUESTED = 'COMMENTS_LIST_REQUESTED';
export const COMMENTS_LIST_RECEIVED = 'COMMENTS_LIST_RECEIVED';
export const COMMENTS_REQUESTED = 'COMMENTS_REQUESTED';
export const COMMENTS_RECEIVED = 'COMMENTS_RECEIVED';
export const COMMENT_CREATED = 'COMMENT_CREATED';
export const COMMENT_DELETED = 'COMMENT_DELETED';

export const commentDeleted = (marketId, investibleId, commentId) => ({
  type: COMMENT_DELETED,
  marketId,
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
