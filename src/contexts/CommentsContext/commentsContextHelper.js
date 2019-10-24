import { fetchCommentList, fetchComments } from '../../api/comments';
import { convertDates, fixFileLinks, getOutdatedObjectIds, removeDeletedObjects } from '../ContextUtils';
import _ from 'lodash';
import LocalForageHelper from '../LocalForageHelper';
import { COMMENTS_CONTEXT_NAMESPACE, EMPTY_STATE } from './CommentsContext';
import { updateMarketComment, updateMarketComments } from './commentsContextReducer';


export function addComment(dispatch, marketId, comment) {
  const converted = convertDates(comment);
  const tokensAdded = fixFileLinks(converted);
  return dispatch(updateMarketComment(marketId, tokensAdded));
}

/**
 * Updates a comment locally, making it visible to user.
 * We don't update the updated_at field, since we want the message
 * from the socket to do the real update
 * Call after the save on the backend.
 */
export function updateComment(dispatch, commentId, marketId, body) {
  const updateDelta = {
    id: commentId,
    body,
  };
  return dispatch(updateMarketComment(marketId, updateDelta));
}

export function getMarketComments(state, marketId) {
  return state[marketId];
}

export function refreshMarketComments(dispatch, marketId) {
  const lfh = new LocalForageHelper(COMMENTS_CONTEXT_NAMESPACE);
  return lfh.getState()
    .then((state) => {
      const usedState = state || EMPTY_STATE;
      const oldMarketComments = usedState[marketId];
      return fetchCommentList(marketId)
        .then((marketCommentsList) => {
          const { comments: fetchedCommentsList } = marketCommentsList;
          const deletedRemoved = removeDeletedObjects(fetchedCommentsList, oldMarketComments);
          const needsUpdating = getOutdatedObjectIds(fetchedCommentsList, deletedRemoved);
          // the api supports max of 100 at a time
          const fetchChunks = _.chunk(needsUpdating, 100);
          const promises = fetchChunks.reduce((acc, chunk) => {
            const chunkPromise = fetchComments(chunk, marketId);
            return acc.concat(chunkPromise);
          }, []);
          return Promise.all(promises)
            .then((commentChunks) => {
              const flattenedComments = _.flatten(commentChunks);
              const dateConverted = flattenedComments.map((comment) => convertDates(comment));
              const linksFixed = dateConverted.map((comment) => fixFileLinks(comment));
              const newMarketComments = _.unionBy(linksFixed, deletedRemoved, 'id');
              dispatch(updateMarketComments(marketId, newMarketComments));
            });
        });
    });
}
