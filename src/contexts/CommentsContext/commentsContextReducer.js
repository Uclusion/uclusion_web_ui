import _ from 'lodash'
import LocalForageHelper from '../../utils/LocalForageHelper'
import { COMMENTS_CONTEXT_NAMESPACE } from './CommentsContext'

const INITIALIZE_STATE = 'INITIALIZE_STATE';
const REMOVE_MARKETS_COMMENT = 'REMOVE_MARKETS_COMMENT';
const REMOVE_COMMENTS_FROM_MARKET = 'REMOVE_COMMENTS_FROM_MARKET';
const OVERWRITE_MARKET_COMMENTS = 'OVERWRITE_MARKET_COMMENTS';
const UPDATE_FROM_VERSIONS = 'UPDATE_FROM_VERSIONS';

/** Messages we can send to the reducer */

export function initializeState(newState) {
  return {
    type: INITIALIZE_STATE,
    newState,
  };
}

export function updateCommentsFromVersions(marketId, comments) {
  return {
    type: UPDATE_FROM_VERSIONS,
    marketId,
    comments,
  };
}

export function overwriteMarketComments(marketId, comments) {
  return {
    type: OVERWRITE_MARKET_COMMENTS,
    marketId,
    comments,
  };
}

export function removeCommentsFromMarket(marketId, comments) {
  return {
    type: REMOVE_COMMENTS_FROM_MARKET,
    marketId,
    comments,
  };
}

export function removeMarketsComments(marketIds) {
  return {
    type: REMOVE_MARKETS_COMMENT,
    marketIds,
  };
}

/** Functions that update the reducer state */

// Required for quick add because version of parent comment has not changed
function doOverwriteMarketComments(state, action) {
  const { marketId, comments } = action;
  const { initializing } = state;
  if (initializing) {
    return {
      [marketId]: comments,
    };
  }
  return {
    ...state,
    [marketId]: comments,
  };
}

function doRemoveCommentsFromMarket(state, action) {
  const { marketId, comments } = action;
  const oldMarketComments = state[marketId] || [];
  const newMarketComments = oldMarketComments.filter((comment) => !comments.includes(comment.id));
  return {
    ...state,
    [marketId]: newMarketComments,
  };
}

function doRemoveMarketsComments(state, action) {
  const { marketIds } = action;
  return _.omit(state, marketIds);
}

function computeNewState(state, action) {
  switch (action.type) {
    case REMOVE_MARKETS_COMMENT:
      return doRemoveMarketsComments(state, action);
    case REMOVE_COMMENTS_FROM_MARKET:
      return doRemoveCommentsFromMarket(state, action);
    case OVERWRITE_MARKET_COMMENTS:
    case UPDATE_FROM_VERSIONS:
      return doOverwriteMarketComments(state, action);
    case INITIALIZE_STATE:
      return action.newState;
    default:
      return state;
  }
}

function reducer(state, action) {
  const newState = computeNewState(state, action);
  if (action.type === UPDATE_FROM_VERSIONS) {
    const lfh = new LocalForageHelper(COMMENTS_CONTEXT_NAMESPACE);
    lfh.setState(newState);
  }
  return newState;
}

export default reducer;