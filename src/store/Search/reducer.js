import { combineReducers } from 'redux';
import { INVESTIBLE_SEARCH_RESULTS } from './actions';

function investibles(state = {}, action) {
  switch (action.type) {
    case INVESTIBLE_SEARCH_RESULTS:
      return { query: action.query, results: action.results };
    default:
      return state;
  }
}

export function getActiveInvestibleSearchQuery(state){
  const { investibles } = state;
  if (investibles && investibles.query) {
    return investibles.query;
  }
  return '';
}

export function hasInvestibleSearchActive(state) {
  return getActiveInvestibleSearchQuery(state) !== '';
}

export function getActiveInvestibleSearchResults(state) {
  const { investibles } = state;
  if (investibles && investibles.results) {
    return investibles.results;
  }
  return [];
}

export default combineReducers({ investibles })