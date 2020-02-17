import _ from 'lodash';
import LocalForageHelper from '../LocalForageHelper';
import { COMMENTS_CONTEXT_NAMESPACE } from './CommentsContext';

const INITIALIZE_STATE = 'INITIALIZE_STATE';
const UPDATE_MARKET_COMMENTS = 'UPDATE_MARKET_COMMENTS';
const REMOVE_MARKETS_COMMENT = 'REMOVE_MARKETS_COMMENT';
const REMOVE_COMMENTS_FROM_MARKET = 'REMOVE_COMMENTS_FROM_MARKET';


/** Messages we can send to the reducer */

export function initializeState(newState) {
  return {
    type: INITIALIZE_STATE,
    newState,
  };
}
export function updateMarketComments(marketId, comments) {
  return {
    type: UPDATE_MARKET_COMMENTS,
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

function doUpdateMarketComments(state, action) {
  const { marketId, comments } = action;
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
    case UPDATE_MARKET_COMMENTS:
      return doUpdateMarketComments(state, action);
    case REMOVE_MARKETS_COMMENT:
      return doRemoveMarketsComments(state, action);
    case REMOVE_COMMENTS_FROM_MARKET:
      return doRemoveCommentsFromMarket(state, action);
    case INITIALIZE_STATE:
      return action.newState;
    default:
      return state;
  }
}

function reducer(state, action) {
  const newState = computeNewState(state, action);
  const lfh = new LocalForageHelper(COMMENTS_CONTEXT_NAMESPACE);
  lfh.setState(newState);
  return newState;
}

export default reducer;