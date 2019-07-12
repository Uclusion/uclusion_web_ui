/* eslint-disable no-case-declarations */
import { combineReducers } from 'redux';

import _ from 'lodash';
import {
  RECEIVE_INVESTIBLES, RECEIVE_INVESTIBLE_LIST,
  INVESTIBLE_CREATED, INVESTIBLE_DELETED,
  INVESTIBLE_FOLLOW_UNFOLLOW, INVESTMENT_UPDATED,
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


function updateSingleInvestible(state, marketId, investibleId, newValues) {
  const newState = { ...state };
  const marketInvestibles = newState[marketId];
  if (marketInvestibles) {
    const oldInvestible = marketInvestibles.find(item => item.id === investibleId);
    if (oldInvestible) {
      const newInvestible = { ...oldInvestible, ...newValues };
      const newMarketInvestibles = _.unionBy([newInvestible], marketInvestibles, 'id');
      newState[marketId] = newMarketInvestibles;
    }
  }
  return newState;
}

export function getInvestibleDeletedState(state, action){
  const { marketId, investibleId } = action;
  if (state[marketId]) {
    const newState = { ...state };
    newState[marketId] = state[marketId].filter(
      item => (item.id !== investibleId),
    );
    return newState;
  }
  // no investible list to change, hence nothing to do
  return state;
}

function getInvestibleFollowUnfollowState(state, action) {
  const { marketId, investibleId, isFollowing } = action;
  const newValues = { current_user_is_following: isFollowing };
  return updateSingleInvestible(state, marketId, investibleId, newValues);
}

function getInvestmentUpdateState(state, action){
  const { marketId, investibleId, quantity } = action;
  const newValues = { current_user_investment: quantity };
  return updateSingleInvestible(state, marketId, investibleId, newValues);
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
    case INVESTIBLE_DELETED:
      return getInvestibleDeletedState(state, action);
    case INVESTIBLE_FOLLOW_UNFOLLOW:
      return getInvestibleFollowUnfollowState(state, action);
    case INVESTMENT_UPDATED:
      return getInvestmentUpdateState(state, action);
    default:
      return state;
  }
};

export const getInvestibles = state => state.items;


export default combineReducers({
  items,
});
