import _ from 'lodash'
import LocalForageHelper from '../../utils/LocalForageHelper'
import { COMMENTS_CONTEXT_NAMESPACE } from './CommentsContext'
import { removeInitializing } from '../../components/localStorageUtils'
import { addByIdAndVersion, fixupItemsForStorage } from '../ContextUtils'
import { leaderContextHack } from '../LeaderContext/LeaderContext';

const INITIALIZE_STATE = 'INITIALIZE_STATE';
const REMOVE_MARKETS_COMMENT = 'REMOVE_MARKETS_COMMENT';
const OVERWRITE_MARKET_COMMENTS = 'OVERWRITE_MARKET_COMMENTS';
const UPDATE_FROM_VERSIONS = 'UPDATE_FROM_VERSIONS';

/** Messages we can send to the reducer */

export function initializeState(newState) {
  return {
    type: INITIALIZE_STATE,
    newState,
  };
}

export function updateCommentsFromVersions(commentDetails, existingCommentIds) {
  return {
    type: UPDATE_FROM_VERSIONS,
    commentDetails,
    existingCommentIds
  };
}

export function updateComments(marketId, comments) {
  return {
    type: OVERWRITE_MARKET_COMMENTS,
    marketId,
    comments
  };
}

export function removeMarketsComments(marketIds) {
  return {
    type: REMOVE_MARKETS_COMMENT,
    marketIds,
  };
}

/** Functions that update the reducer state */

function doAddMarketComments(state, action) {
  const { marketId, comments } = action;
  const transformedComments = fixupItemsForStorage(comments);
  const oldComments = state[marketId] || [];
  const newState = {...state};
  newState[marketId] = addByIdAndVersion(transformedComments, oldComments);
  return removeInitializing(newState);
}

function doAddMarketsComments(state, action) {
  const { commentDetails, existingCommentIds } = action;
  const newState = {...state};
  const now = Date.now();
  Object.keys(commentDetails).forEach((marketId) => {
    const transformedComments = fixupItemsForStorage(commentDetails[marketId]);
    const oldCommentsRaw = state[marketId] || [];
    const oldComments = !_.isEmpty(existingCommentIds) ? oldCommentsRaw.filter((oldComment) => {
      const updatedAt = new Date(oldComment.updated_at);
      if (now - updatedAt.getTime() < 90*86400000) {
        // Archived algorithm checks if archived 3 months ago before screening out
        return true;
      }
      // If this comment screened because of archiving then remove from disk to conserve memory
      return !_.isEmpty(existingCommentIds.find((commentId) => commentId === oldComment.id));
    }) : oldCommentsRaw;
    newState[marketId] = addByIdAndVersion(transformedComments, oldComments);
  });
  return removeInitializing(newState);
}

function doRemoveMarketsComments(state, action) {
  const { marketIds } = action;
  return _.omit(state, marketIds);
}

function computeNewState(state, action) {
  switch (action.type) {
    case REMOVE_MARKETS_COMMENT:
      return doRemoveMarketsComments(state, action);
    case OVERWRITE_MARKET_COMMENTS:
      return doAddMarketComments(state, action);
    case UPDATE_FROM_VERSIONS:
      return doAddMarketsComments(state, action);
    case INITIALIZE_STATE:
      return action.newState;
    default:
      return state;
  }
}

let commentsStoragePromiseChain = Promise.resolve(true);

function reducer(state, action) {
  const newState = computeNewState(state, action);
  if (action.type !== INITIALIZE_STATE) {
    const { isLeader } = leaderContextHack;
    if (isLeader) {
      const lfh = new LocalForageHelper(COMMENTS_CONTEXT_NAMESPACE);
      commentsStoragePromiseChain = commentsStoragePromiseChain.then(() => {
        return lfh.setState(newState).then(() => {
          console.info('Updated comment context storage.')
        });
      });
    }
  }
  return newState;
}

export default reducer;