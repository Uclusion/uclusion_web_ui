import _ from 'lodash';
import LocalForageHelper from '../LocalForageHelper';
import { COMMENTS_CONTEXT_NAMESPACE } from './CommentsContext';

const INITIALIZE_STATE = 'INITIALIZE_STATE';
const UPDATE_MARKET_COMMENTS = 'UPDATE_MARKET_COMMENTS';
const UPDATE_MARKET_COMMENT = 'UPDATE_MARKET_COMMENT';



/** Messages we can send to the reducer **/

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

export function updateMarketComment(marketId, comment) {
  return {
    type: UPDATE_MARKET_COMMENT,
    marketId,
    comment,
  };
}


/** Functions that update the reducer state **/

function doUpdateComment(state, action) {
  const { marketId, comment: commentUpdate } = action;
  const { id } = commentUpdate;
  const newUpdated = commentUpdate.updated_at || Date(0);
  const oldMarketComments = state[marketId] || [];
  // first we update the comments themselves
  const oldComment = oldMarketComments.find((comment) => comment.id === id);
  let newComment = {
    ...commentUpdate,
    updated_at: newUpdated,
  };
  if (oldComment) {
    console.debug('Updating old comment');
    newComment = { ...oldComment, ...commentUpdate };
  }
  const parent = oldMarketComments.find((comment) => comment.id === commentUpdate.reply_id);
  const updateList = [newComment];
  if (parent && !oldComment) {
    const oldChildren = parent.children || [];
    const newChildren = [...oldChildren, id];
    const newParent = { ...parent, children: newChildren };
    updateList.push(newParent);
  }
  const newMarketComments = _.unionBy(updateList, oldMarketComments, 'id');
  console.log(newMarketComments);
  const newState = {
    ...state,
    [marketId]: newMarketComments,
  };
  return newState;
}

function doUpdateMarketComments(state, action) {
  const { marketId, comments } = action;
  return {
    ...state,
    [marketId]: comments,
  };
}

function computeNewState(state, action) {
  switch (action.type) {
    case UPDATE_MARKET_COMMENTS:
      return doUpdateMarketComments(state, action);
    case UPDATE_MARKET_COMMENT:
      return doUpdateComment(state, action);
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