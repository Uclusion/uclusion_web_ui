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

const AsyncCommentsContext = context;

function AsyncCommentsProvider(props) {
  const [state, setState] = useState(emptyState);
  const [isInitialization, setIsInitialization] = useState(true);
  // set the new state cache to something we control, so that our
  // provider descendants will pick up changes to it
  console.log('Replacing comments state cache');
  addStateCache(state, setState);
  // the provider value needs the new state cache object in order to allert
  // provider descendants to changes
  const providerState = { ...contextPackage, stateCache: state, refreshMarketComments };
  useEffect(() => {
    if (isInitialization) {
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
  }, [isInitialization]);

  return (
    <AsyncCommentsContext.Provider value={providerState}>
      {props.children}
    </AsyncCommentsContext.Provider>
  );
}

export { AsyncCommentsProvider, AsyncCommentsContext };
