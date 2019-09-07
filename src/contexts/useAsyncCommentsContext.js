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
        const { commentsList, comments } = state;
        const oldCommentsList = commentsList[marketId];
        const oldComments = comments[marketId];
        return fetchCommentList(marketId)
          .then((commentsList) => {
            const needsUpdating = getOutdatedObjectIds(commentsList, oldCommentsList);
            const deletedRemoved = removeDeletedObjects(commentsList, oldComments);
            // the api supports max of 100 at a time
            const fetchChunks = _.chunk(needsUpdating, 100);
            const promises = fetchChunks.reduce((acc, chunk) => {
              const chunkPromises = chunk.map((ids) => fetchComments(ids, marketId));
              return acc.concat(chunkPromises);
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

  return {
    ...stateCache,
    refreshMarketComments,
  };
}

export default useInvestiblesContext;
