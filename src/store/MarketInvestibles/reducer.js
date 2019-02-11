/* eslint-disable no-case-declarations */
import { combineReducers } from 'redux';
import _ from 'lodash';
import {
  RECEIVE_INVESTIBLES,
  INVESTMENT_CREATED,
  INVESTIBLE_CREATED, MARKET_INVESTIBLE_CREATED, MARKET_INVESTIBLE_DELETED,
} from './actions';

const reFormatInvestible = (investible) => {
  investible.created_at = new Date(investible.created_at);
  investible.updated_at = new Date(investible.updated_at);
  investible.last_investment_at = new Date(investible.last_investment_at);
  return investible;
};

const reFormatInvestibles = (items) => {
  Object.keys(items).forEach((key) => {
    items[key].forEach((investible) => {
      reFormatInvestible(investible);
    });
  });
  return items;
};

const items = (state = [], action) => {
  switch (action.type) {
    case RECEIVE_INVESTIBLES:
    case INVESTIBLE_CREATED:
      const marketId = action.marketId ? action.marketId : 'template';
      let investibles = action.investibles ? action.investibles : action.investible;
      if (!Array.isArray(investibles)) {
        investibles = [investibles];
      }
      const newState = { ...state };
      newState[marketId] = _.unionBy(investibles, state[marketId], 'id');
      return newState;
    case MARKET_INVESTIBLE_DELETED:
      const newStateForDelete = { ...state };
      newStateForDelete[action.marketId] = state[action.marketId].filter(
        item => item.id !== action.investibleId
      );
      return newStateForDelete;
    case INVESTMENT_CREATED:
    case MARKET_INVESTIBLE_CREATED:
      const newStateForCreation = { ...state };
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
      newStateForCreation[investibleCopy.market_id] = _.unionBy([investibleCopy],
        state[investibleCopy.market_id], 'id');
      return newStateForCreation;
    default:
      return state;
  }
};

export const getInvestibles = state => reFormatInvestibles(state.items);

export default combineReducers({
  items,
});
