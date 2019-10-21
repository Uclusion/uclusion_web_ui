import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import { Hub } from '@aws-amplify/core';
import { createCachedAsyncContext } from './CachedAsyncContextCreator';
import { fetchCommentList, fetchComments } from '../api/comments';
import { convertDates, getOutdatedObjectIds, removeDeletedObjects } from './ContextUtils';
import { MESSAGES_EVENT, PUSH_COMMENTS_CHANNEL } from './WebSocketContext';

const emptyState = {
  comments: {},
  commentsList: {},
};

const contextPackage = createCachedAsyncContext('async_comments', emptyState);

const {
  context, addStateCache, getState, setStateValues, loadingWrapper,
} = contextPackage;

/*
   Comments are retrieved on _markets_, not investibles. That means,
   to refresh our comments store, I need to pull the entire list back from the market,
   do a date updated comparision, and then fetch those comments that are out of date (or new)
   Unfortunately, we want to _read_ comments by both market and investible, so we'll have
   to maintain two data structures. The first to deal with the updating,
   and the second actually containing
   the comments indexed by their market ID which we'll inspect to determine if they are
   market or investible comments.
   */
function refreshMarketComments(marketId) {
  const refreshComments = () => getState()
    .then((state) => {
      const { commentsList, comments } = state;
      const oldMarketCommentsList = commentsList[marketId];
      const oldMarketComments = comments[marketId];
      return fetchCommentList(marketId)
        .then((marketCommentsList) => {
          const { comments: fetchedCommentsList } = marketCommentsList;
          const needsUpdating = getOutdatedObjectIds(fetchedCommentsList, oldMarketCommentsList);
          const deletedRemoved = removeDeletedObjects(fetchedCommentsList, oldMarketComments);
          // the api supports max of 100 at a time
          const fetchChunks = _.chunk(needsUpdating, 100);
          const promises = fetchChunks.reduce((acc, chunk) => {
            const chunkPromise = fetchComments(chunk, marketId);
            return acc.concat(chunkPromise);
          }, []);
          const listDateConverted = fetchedCommentsList.map((comment) => convertDates(comment));
          const newCommentsList = { ...commentsList, [marketId]: listDateConverted };
          return setStateValues({ commentsList: newCommentsList })
            .then(() => Promise.all(promises)
              .then((commentChunks) => {
                const flattenedComments = _.flatten(commentChunks);
                const dateConverted = flattenedComments.map((comment) => convertDates(comment));
                const newMarketComments = _.unionBy(dateConverted, deletedRemoved, 'id');
                const newComments = { ...comments, [marketId]: newMarketComments };
                return setStateValues({ comments: newComments });
              }));
        });
    });
  return loadingWrapper(refreshComments);
}

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


const AsyncCommentsContext = context;

function AsyncCommentsProvider(props) {
  console.debug('Comments context being rerendered');
  const [state, setState] = useState(emptyState);
  const [isInitialization, setIsInitialization] = useState(true);
  // the provider value needs the new state cache object in order to allert
  // provider descendants to changes
  contextPackage.stateCache = state;
  const contextHelper = {
    ...state,
    createCommentsHash,
    refreshMarketComments,
    updateCommentLocally,
    addCommentLocally,
  };
  _.assignIn(contextPackage, contextHelper);

  const providerState = { ...contextPackage, stateCache: state, refreshMarketComments };
  useEffect(() => {
    if (isInitialization) {
      // set the new state cache to something we control, so that our
      // provider descendants will pick up changes to it
      console.log('Replacing comments state cache');
      addStateCache(state, setState);
      Hub.listen(PUSH_COMMENTS_CHANNEL, (data) => {
        const { payload: { event, message } } = data;

        switch (event) {
          case MESSAGES_EVENT: {
            const { indirect_object_id: marketId } = message;
            refreshMarketComments(marketId);
            break;
          }
          default:
            console.debug(`Ignoring push event ${event}`);
        }
      });
      setIsInitialization(false);
    }
    return () => {
    };
  }, [isInitialization, state]);

  return (
    <AsyncCommentsContext.Provider value={providerState}>
      {props.children}
    </AsyncCommentsContext.Provider>
  );
}

export { AsyncCommentsProvider, AsyncCommentsContext };
