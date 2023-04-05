import _ from 'lodash'
import LocalForageHelper from '../../utils/LocalForageHelper'
import { COMMENTS_CHANNEL, COMMENTS_CONTEXT_NAMESPACE } from './CommentsContext'
import { BroadcastChannel } from 'broadcast-channel'
import { broadcastId } from '../../components/ContextHacks/BroadcastIdProvider'
import { removeInitializing } from '../../components/localStorageUtils'
import { addByIdAndVersion, fixupItemsForStorage } from '../ContextUtils'

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

export function updateCommentsFromVersions(commentDetails) {
  return {
    type: UPDATE_FROM_VERSIONS,
    commentDetails
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

function doAddMarketComments(state, action) {
  const { marketId, comments } = action;
  const transformedComments = comments.map((comment) => {
    return { ...comment, fromQuickAdd: true }
  });
  const oldComments = state[marketId] || []
  const newComments = addByIdAndVersion(transformedComments, oldComments)
  return {
    ...removeInitializing(state, true),
    [marketId]: newComments,
  };
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

function doRemoveCommentsFromMarket(state, action) {
  const { marketId, comments } = action;
  const oldMarketComments = state[marketId] || [];
  const newMarketComments = oldMarketComments.map((comment) => {
    const newComment = {...comment}
    if (comments.includes(comment.id)) {
      newComment.deleted = true;
      newComment.fromQuickAdd = true;
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
    const lfh = new LocalForageHelper(COMMENTS_CONTEXT_NAMESPACE);
    commentsStoragePromiseChain = commentsStoragePromiseChain.then(() => {
        lfh.setState(newState).then(() => {
          const myChannel = new BroadcastChannel(COMMENTS_CHANNEL);
          return myChannel.postMessage(broadcastId || 'comments').then(() => myChannel.close())
            .then(() => console.info('Update comment context sent.'));
        });
    });
  }
  return newState;
}

export default reducer;