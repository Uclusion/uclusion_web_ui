/* eslint-disable no-case-declarations */
import { combineReducers } from 'redux';

import _ from 'lodash';
import {
  RECEIVE_INVESTIBLES,
  INVESTMENT_CREATED,
  INVESTIBLE_CREATED, MARKET_INVESTIBLE_CREATED, MARKET_INVESTIBLE_DELETED,
} from './actions';


function reFormatInvestible(investible){
  investible.created_at = new Date(investible.created_at);
  investible.updated_at = new Date(investible.updated_at);
  investible.last_investment_at = new Date(investible.last_investment_at);
  return investible;
}

function reFormatInvestibles(investibles){
  investibles.forEach((item) => {reFormatInvestible(item)});
}

// exported for use by the search reducer
export function getInvestibleCreatedState(state, action){
  const marketId = action.marketId ? action.marketId : 'template';
  const investibles = action.investibles ? action.investibles : [action.investible];

  reFormatInvestibles(investibles);
  const newState = { ...state };
  // console.log(`Combining ${JSON.stringify(investibles)}`);
  newState[marketId] = _.unionBy(investibles, state[marketId], 'id');
  return newState;
}

// exported for use by the search reducer
function getMarketInvestibleCreatedState(state, action){
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
  reFormatInvestible(investibleCopy);
  newState[investibleCopy.market_id] = _.unionBy([investibleCopy],
    state[investibleCopy.market_id], 'id');
  return newState;
}

export function getMarketInvestibleDeletedState(state, action){
  const newState = { ...state };
  newState[action.marketId] = state[action.marketId].filter(
    item => (item.id !== action.investibleId),
  );
  return newState;
}

const items = (state = [], action) => {
  switch (action.type) {
    case RECEIVE_INVESTIBLES:
    case INVESTIBLE_CREATED:
      return getInvestibleCreatedState(state, action);
    case MARKET_INVESTIBLE_DELETED:
      return getMarketInvestibleDeletedState(state, action);
    case INVESTMENT_CREATED:
    case MARKET_INVESTIBLE_CREATED:
      return getMarketInvestibleCreatedState(state, action);
    default:
      return state;
  }
};

export const getInvestibles = state => state.items;


export default combineReducers({
  items,
});
