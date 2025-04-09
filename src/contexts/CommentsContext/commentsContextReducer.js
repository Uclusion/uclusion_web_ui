import _ from 'lodash'
import LocalForageHelper from '../../utils/LocalForageHelper'
import { COMMENTS_CHANNEL, COMMENTS_CONTEXT_NAMESPACE } from './CommentsContext'
import { BroadcastChannel } from 'broadcast-channel'
import { broadcastId } from '../../components/ContextHacks/BroadcastIdProvider'
import { removeInitializing } from '../../components/localStorageUtils'
import { addByIdAndVersion, fixupItemsForStorage } from '../ContextUtils'
import { syncMarketList } from '../../components/ContextHacks/ForceMarketSyncProvider';

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

export function updateCommentsFromVersions(commentDetails) {
  return {
    type: UPDATE_FROM_VERSIONS,
    commentDetails
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
  syncMarketList.push(marketId);
  const transformedComments = fixupItemsForStorage(comments);
  const oldComments = state[marketId] || [];
  const newState = {...state};
  newState[marketId] = addByIdAndVersion(transformedComments, oldComments);
  return removeInitializing(newState);
}

function doAddMarketsComments(state, action, isNetworkUpdate=false) {
  const { commentDetails } = action;
  const newState = {...state};
  const now = Date.now();
  Object.keys(commentDetails).forEach((marketId) => {
    const transformedComments = fixupItemsForStorage(commentDetails[marketId]);
    const oldCommentsRaw = state[marketId] || [];
    const oldComments = isNetworkUpdate ? oldCommentsRaw.filter((oldComment) => {
      const updatedAt = new Date(oldComment.updated_at);
      if (now - updatedAt.getTime() < 90*86400000) {
        // Archived algorithm checks if archived 3 months ago before screening out
        return true;
      }
      // If this comment screened because of archiving then remove from disk to conserve memory
      return !_.isEmpty(transformedComments?.find((newComment) => newComment.id === oldComment.id));
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
      return doAddMarketsComments(state, action, true);
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