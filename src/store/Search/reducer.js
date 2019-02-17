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

export function hasInvestibleSearchActive(state) {
  const { investibles } = state;
  if (investibles && investibles.query) {
    return investibles.query !== '';
  }
  return false;
}

export function getActiveInvestibleSearchResults(state) {
  const { investibles } = state;
  if (investibles && investibles.results) {
    return investibles.results;
  }
  return [];
}

export default combineReducers({ investibles })