import { combineReducers } from "redux";
import { INVESTIBLE_SEARCH_RESULTS, CHANGE_STAGE_SELECTION } from './actions';


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
export function getActiveInvestibleSearches(state) {
  return state.investibleSearches;
}

function selectedStage(state = {}, action) {
  const newState = { ...state };
  switch (action.type) {
    case CHANGE_STAGE_SELECTION:
      newState[action.marketId] = action.selectedStage;
      return newState;
    default:
      return state;
  }
}

export function getSelectedStage(state) {
  return state.selectedStage;
}

export default combineReducers({ investibleSearches, selectedStage });
