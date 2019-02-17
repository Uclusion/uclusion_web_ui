import { combineReducers } from 'redux';
import { INVESTIBLE_SEARCH_RESULTS } from './actions';

function investibles(state = {}, action){
  switch (action.type) {
    case INVESTIBLE_SEARCH_RESULTS:
      return { query: action.query, results: action.results };
    default:
      return state;
  }
}


export default combineReducers(investibles)