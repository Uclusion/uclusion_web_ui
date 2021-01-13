import _ from 'lodash'
import LocalForageHelper from '../../utils/LocalForageHelper'
import { COMMENTS_CHANNEL, COMMENTS_CONTEXT_NAMESPACE, MEMORY_COMMENTS_CONTEXT_NAMESPACE } from './CommentsContext'
import { BroadcastChannel } from 'broadcast-channel'
import { broadcastId } from '../../components/ContextHacks/BroadcastIdProvider'
import { REPORT_TYPE } from '../../constants/comments';

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
  // progress reports are considered resolved by the front end when they
  // are 24 hours old
  const OneDay = 60*60*24*1000;
  function isResolved(comment) {
    const { created_at, comment_type, resolved } = comment;
    if (!created_at) {
      console.error('no created at');
      return false;
    }
    if (comment_type === REPORT_TYPE) {
      const now = Date.now();
      const expires = created_at.getTime() + OneDay;
      return now >= expires;
    }
    return resolved;
  }

  const progressResolvedComments = comments.map((comment) => ({...comment, resolved: isResolved(comment)}));

  const { initializing } = state;
  if (initializing) {
    return {
      [marketId]: progressResolvedComments,
    };
  }
  return {
    ...state,
    [marketId]: progressResolvedComments,
  };
}

function doRemoveCommentsFromMarket(state, action) {
  const { marketId, comments } = action;
  const oldMarketComments = state[marketId] || [];
  const newMarketComments = oldMarketComments.map((comment) => {
    const newComment = {...comment}
    if (comments.includes(comment.id)) {
      newComment.deleted = true;
    }
    return newComment;
  });
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
  const lfh = new LocalForageHelper(MEMORY_COMMENTS_CONTEXT_NAMESPACE);
  lfh.setState(newState).then(() => {
    if (action.type !== INITIALIZE_STATE) {
      const myChannel = new BroadcastChannel(COMMENTS_CHANNEL);
      return myChannel.postMessage(broadcastId || 'comments').then(() => myChannel.close())
        .then(() => console.info('Update comment context sent.'));
    }
  });
  if (action.type === UPDATE_FROM_VERSIONS) {
    const lfh = new LocalForageHelper(COMMENTS_CONTEXT_NAMESPACE);
    lfh.setState(newState);
  }
  return newState;
}

export default reducer;