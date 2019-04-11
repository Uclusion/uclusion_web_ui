/* eslint-disable no-case-declarations */
import { combineReducers } from 'redux';

import _ from 'lodash';
import {
  RECEIVE_INVESTIBLES, RECEIVE_INVESTIBLE_LIST,
  INVESTMENT_CREATED,
  INVESTIBLE_CREATED, MARKET_INVESTIBLE_CREATED, MARKET_INVESTIBLE_DELETED, INVESTMENTS_DELETED,
  INVESTIBLE_FOLLOW_UNFOLLOW,
} from './actions';


// exported for use by the search reducer
export function getInvestibleCreatedState(state, action){
  const marketId = action.marketId ? action.marketId : 'template';
  const investibles = action.investibles ? action.investibles : [action.investible];
  const newState = { ...state };
  // console.log(`Combining ${JSON.stringify(investibles)}`);
  newState[marketId] = _.unionBy(investibles, state[marketId], 'id');
  return newState;
}

// exported for use by the search reducer
export function getMarketInvestibleCreatedState(state, action){
  const newState = { ...state };
  const { investment, marketInvestible } = action;
  const investibleId = marketInvestible ? marketInvestible.investible_id
    : investment.investible_id;
  const findInvestibleId = marketInvestible ? marketInvestible.copiedInvestibleId
    : investibleId;
  const investibleMarketId = marketInvestible ? 'template' : investment.market_id;
  const investible = state[investibleMarketId].find(element => element.id === findInvestibleId);
  let investibleCopy;
  if (marketInvestible) {
    // This is a bind to market
    investibleCopy = { ...investible, ...marketInvestible };
  } else {
    investibleCopy = { ...investible };
  }
  investibleCopy.id = investibleId;
  investibleCopy.quantity = investment ? investment.investible_quantity : 0;
  investibleCopy.current_user_investment = investment ? investment.current_user_investment : 0;
  newState[investibleCopy.market_id] = _.unionBy([investibleCopy],
    state[investibleCopy.market_id], 'id');
  return newState;
}

export function getMarketInvestibleDeletedState(state, action){
  if (state[action.marketId]) {
    const newState = { ...state };
    newState[action.marketId] = state[action.marketId].filter(
      item => (item.id !== action.investibleId),
    );
    return newState;
  }
  // no investible list to change, hence nothing to do
  return state;
}

function getInvestibleFollowUnfollowState(state, action){
  const newState = { ...state };
  const { investible, isFollowing } = action;
  const marketInvestibles = newState[investible.market_id];
  if (marketInvestibles) {
    const oldInvestible = marketInvestibles.find(item => item.id === investible.id);
    if (oldInvestible) {
      const newInvestible = { ...oldInvestible };
      newInvestible.current_user_is_following = isFollowing;
      const newMarketInvestibles = _.unionBy([newInvestible], marketInvestibles, 'id');
      newState[investible.market_id] = newMarketInvestibles;
    }
  }
  return newState;
}

function getInvestmentsDeletedState(state, action) {
  const newState = { ...state };
  const { marketId, investibleId, quantity } = action;
  const marketInvestibles = newState[marketId];
  if (marketInvestibles) {
    const oldInvestible = marketInvestibles.find(item => item.id === investibleId);
    if (oldInvestible) {
      const newInvestible = { ...oldInvestible };
      newInvestible.quantity -= quantity;
      const newMarketInvestibles = _.unionBy([newInvestible], marketInvestibles, 'id');
      newState[marketId] = newMarketInvestibles;
    }
  }
  return newState;
}

/**
 * The only thing we can do when we receive an investible list is to
 * delete those investibles which aren't in it.
 * @param state the old state
 * @param action the action
 * @returns {*} the new state
 */
function getReceiveInvestibleListState(state, action) {
  const { marketId, investibleList } = action;
  // console.debug(marketId);
  if (!state[marketId]) {
    return state;
  }
  const newState = { ...state };
  const investibleHash = investibleList.reduce((hash, element) => {
    hash[element.id] = element; //eslint-disable-line
    return hash;
  }, {});
  const oldInvestibles = newState[marketId];
  const newInvestibles = oldInvestibles.filter((element) => {
    const exists = investibleHash[element.id];
    // if (!exists) {
    //  console.log("Removing investible " + element.id);
    // }
    return exists;
  });
  newState[marketId] = newInvestibles;
  return newState;
}

const items = (state = [], action) => {
  switch (action.type) {
    case RECEIVE_INVESTIBLE_LIST:
      return getReceiveInvestibleListState(state, action);
    case RECEIVE_INVESTIBLES:
    case INVESTIBLE_CREATED:
      return getInvestibleCreatedState(state, action);
    case MARKET_INVESTIBLE_DELETED:
      return getMarketInvestibleDeletedState(state, action);
    case INVESTMENT_CREATED:
    case MARKET_INVESTIBLE_CREATED:
      return getMarketInvestibleCreatedState(state, action);
    case INVESTIBLE_FOLLOW_UNFOLLOW:
      return getInvestibleFollowUnfollowState(state, action);
    case INVESTMENTS_DELETED:
      return getInvestmentsDeletedState(state, action);
    default:
      return state;
  }
};

export const getInvestibles = state => state.items;


export default combineReducers({
  items,
});
