import { combineReducers } from 'redux';
import PropTypes from 'prop-types';
import _ from 'lodash';
import {
  RECEIVE_INVESTIBLES,
  INVESTMENT_CREATED,
  INVESTIBLE_CREATED, MARKET_INVESTIBLE_CREATED, MARKET_INVESTIBLE_DELETED, RECEIVE_MARKET_INVESTIBLE_LIST,
} from './actions';

export const investiblePropType = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  market_id: PropTypes.string,
  description: PropTypes.string.isRequired,
  category_list: PropTypes.arrayOf(PropTypes.string),
  quantity: PropTypes.number,
  investment_in_window1: PropTypes.number,
  created_at: PropTypes.instanceOf(Date),
  updated_at: PropTypes.instanceOf(Date),
  last_investment_at: PropTypes.instanceOf(Date),
  current_user_investment: PropTypes.number,
});

const reFormatInvestible = (investible) => {
  investible.created_at = new Date(investible.created_at);
  investible.updated_at = new Date(investible.updated_at);
  investible.last_investment_at = new Date(investible.last_investment_at);
  return investible;
};

const reFormatInvestibles = (investibles) => {
  investibles.forEach((investible) => {
    reFormatInvestible(investible);
  });
  return investibles;
};

const items = (state = [], action) => {
  switch (action.type) {
    case RECEIVE_MARKET_INVESTIBLE_LIST:
      return state;
    case RECEIVE_INVESTIBLES:
    case INVESTIBLE_CREATED:
      let investibles = action.investibles ? action.investibles : action.investible;
      if (!Array.isArray(investibles)) {
        investibles = [investibles];
      }
      const newState = _.unionBy(investibles, state, 'id');
      return newState;
    case MARKET_INVESTIBLE_DELETED:
      return state.filter(item => item.id !== action.investibleId);
    case INVESTMENT_CREATED:
    case MARKET_INVESTIBLE_CREATED:
      const investment = action.investment;
      const marketInvestible = action.marketInvestible;
      const investibleId = marketInvestible ? marketInvestible.investible_id : investment.investible_id;
      const findInvestibleId = marketInvestible ? marketInvestible.copiedInvestibleId : investibleId;
      const investible = state.find(element => element.id === findInvestibleId);
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
      return _.unionBy([investibleCopy], state, 'id');
    default:
      return state;
  }
};

export const getInvestibles = state => reFormatInvestibles(state.items);

export default combineReducers({
  items,
});
