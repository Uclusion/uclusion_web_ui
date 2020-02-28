import {
  fixupItemsForStorage,
} from '../ContextUtils';
import { removeCommentsFromMarket, updateMarketComments } from './commentsContextReducer';


export function getMarketComments(state, marketId) {
  return state[marketId] || [];
}

/**
 * Comment removal is really an investment comment thing,
 * so we're not going to handle the case of comment threads etc.
 * That will probably have to be modeld by an overwrite of contents.
 * Or we will plain not support it
 * @param dispatch
 */
export function removeComments(dispatch, marketId, comments) {
  dispatch(removeCommentsFromMarket(marketId, comments));
}

export function refreshMarketComments(dispatch, marketId, comments) {
  const fixedUp = fixupItemsForStorage(comments);
  dispatch(updateMarketComments(marketId, fixedUp));
}
