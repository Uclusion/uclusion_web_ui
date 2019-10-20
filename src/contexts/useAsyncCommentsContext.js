import { useContext } from 'react';
import _ from 'lodash';
import { AsyncCommentsContext } from './AsyncCommentsContext';
import { convertDates } from './ContextUtils';

function useAsyncCommentsContext() {
  console.debug('use comments context being rerendered');
  const {
    stateCache, setStateValues, getState, refreshMarketComments,
  } = useContext(AsyncCommentsContext);

  function findAndUpdateComment(state, commentUpdate) {
    const { id, market_id: marketId } = commentUpdate;
    const newUpdated = commentUpdate.updated_at || Date(0);
    const { commentsList, comments } = state;
    const oldMarketCommentsList = commentsList[marketId] || [];
    const oldMarketComments = comments[marketId] || [];

    // first we update the comments theselves
    const oldComment = oldMarketComments.find((comment) => comment.id === id);
    let newComment = commentUpdate;
    if (oldComment) {
      console.debug('Updating old comment');
      newComment = { ...oldComment, ...commentUpdate };
    }
    const parent = oldMarketComments.find((comment) => comment.id === commentUpdate.reply_id);
    const updateList = [newComment];
    if (parent && !oldComment) {
      const oldChildren = parent.children || [];
      const newChildren = [...oldChildren, id];
      const newParent = { ...parent, children: newChildren };
      updateList.push(newParent);
    }
    const newMarketComments = _.unionBy(updateList, oldMarketComments, 'id');

    // now we update the comments list
    let newMarketCommentsList = oldMarketCommentsList;
    const oldCommentsListEntry = oldMarketCommentsList.find((comment) => comment.id === id);
    if (!oldCommentsListEntry) {
      console.debug('adding new comment to comment list');
      const newEntry = { ...commentUpdate, updated_at: newUpdated };
      newMarketCommentsList = [...oldMarketCommentsList, newEntry];
    }
    // and save everything
    const newComments = { ...comments, [marketId]: newMarketComments };
    const newCommentsList = { ...commentsList, [marketId]: newMarketCommentsList };
    return setStateValues({ comments: newComments, commentsList: newCommentsList });
  }

  /**
   * Adds/Updates a comment locally, making it visible to user.
   * We don't update the updated_at field, since we want the message
   * from the socket to do the real update
   * Call after the save on the backend.
   */
  function updateCommentLocally(commentId, marketId, investibleId, replyId, body) {
    const artificialComment = {
      id: commentId,
      market_id: marketId,
      investible_id: investibleId,
      reply_id: replyId,
      body,
    };
    return getState().then((state) => findAndUpdateComment(state, artificialComment));
  }

  function addCommentLocally(comment) {
    const converted = convertDates(comment);
    return getState().then((state) => findAndUpdateComment(state, converted));
  }

  function createCommentsHash(marketComments) {
    return _.keyBy(marketComments, 'id');
  }

  return {
    ...stateCache,
    createCommentsHash,
    refreshMarketComments,
    updateCommentLocally,
    addCommentLocally,
  };
}

export default useAsyncCommentsContext;
