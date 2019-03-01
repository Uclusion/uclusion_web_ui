import { combineReducers } from "redux";
import { INVESTIBLE_SEARCH_RESULTS } from './actions';


function investibleSearches(state = {}, action) {
  const newState = { ...state };
  switch (action.type) {
    case INVESTIBLE_SEARCH_RESULTS:
      newState[action.marketId] = { query: action.query, results: action.results};
      return newState;
    default:
      return state;
  }
}
export function getActiveInvestibleSearches(state){
  return state.investibleSearches;
}


export default combineReducers({ investibleSearches });
