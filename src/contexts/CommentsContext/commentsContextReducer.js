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
  const { commentDetails } = action;
  const newState = {...state};
  Object.keys(commentDetails).forEach((marketId) => {
    const transformedComments = fixupItemsForStorage(commentDetails[marketId]);
    const oldComments = state[marketId] || []
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

// Comments lazily fetched for archived jobs are marked doNotPersist so they stay in memory
// for the session but do not regrow disk storage the archive screening reclaimed (J-all-331)
export function screenOutDoNotPersist(state) {
  const hasMarked = Object.values(state).some((comments) =>
    Array.isArray(comments) && comments.some((comment) => comment?.doNotPersist));
  if (!hasMarked) {
    return state;
  }
  const storedState = {...state};
  Object.keys(storedState).forEach((marketId) => {
    if (Array.isArray(storedState[marketId])) {
      storedState[marketId] = storedState[marketId].filter((comment) => !comment?.doNotPersist);
    }
  });
  return storedState;
}

function reducer(state, action) {
  const newState = computeNewState(state, action);
  if (action.type !== INITIALIZE_STATE) {
    const { isLeader } = leaderContextHack;
    if (isLeader) {
      const lfh = new LocalForageHelper(COMMENTS_CONTEXT_NAMESPACE);
      commentsStoragePromiseChain = commentsStoragePromiseChain.then(() => {
        return lfh.setState(screenOutDoNotPersist(newState)).then(() => {
          console.info('Updated comment context storage.')
        });
      });
    }
  }
  return newState;
}

export default reducer;