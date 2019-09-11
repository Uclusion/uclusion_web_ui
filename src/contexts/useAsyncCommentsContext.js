import { useContext } from 'react';
import { AsyncCommentsContext } from './AsyncCommentsContext';
import { fetchCommentList, fetchComments } from '../api/comments';
import _ from 'lodash';
import { convertDates, getOutdatedObjectIds, removeDeletedObjects } from './ContextUtils';

function useInvestiblesContext() {
  const { stateCache, setStateValues, getState } = useContext(AsyncCommentsContext);

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
    return getState()
      .then((state) => {
        console.log('Old State');
        console.log(state);
        const { commentsList, comments } = state;
        const oldCommentsList = commentsList[marketId];
        const oldComments = comments[marketId];
        return fetchCommentList(marketId)
          .then((marketCommentsList) => {
            const { comments: commentsList } = marketCommentsList;
            const needsUpdating = getOutdatedObjectIds(commentsList, oldCommentsList);
            const deletedRemoved = removeDeletedObjects(commentsList, oldComments);
            // the api supports max of 100 at a time
            console.log('Update list');
            console.log(needsUpdating);
            const fetchChunks = _.chunk(needsUpdating, 100);
            console.log('Chunks formed');
            console.log(fetchChunks);
            const promises = fetchChunks.reduce((acc, chunk) => {
              const chunkPromise = fetchComments(chunk, marketId);
              return acc.concat(chunkPromise);
            }, []);
            const newCommentsList = { ...commentsList, [marketId]: commentsList };
            return setStateValues({ commentsList: newCommentsList })
              .then(() => {
                return Promise.all(promises)
                  .then((commentChunks) => {
                    const comments = _.flatten(commentChunks);
                    const dateConverted = comments.map(comment => convertDates(comment));
                    const newMarketComments = _.unionBy(dateConverted, deletedRemoved, 'id');
                    const newComments = { ...oldComments, [marketId]: newMarketComments };
                    setStateValues({ comments: newComments });
                  });
              });
          });
      });
  }

  function getCachedMarketComments(marketId) {
    const { comments } = stateCache;
    const marketComments = comments[marketId] || [];
    return marketComments;
  }

  function getCachedCommentsHash(marketId) {
    const marketComments = getCachedMarketComments(marketId);
    return _.keyBy(marketComments, 'id');
  }

  return {
    ...stateCache,
    getCachedMarketComments,
    getCachedCommentsHash,
    refreshMarketComments,
  };
}

export default useInvestiblesContext;
