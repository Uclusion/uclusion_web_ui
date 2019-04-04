export const INVESTIBLE_SEARCH_RESULTS = 'INVESTIBLE_SEARCH_RESULTS';
export const CHANGE_STAGE_SELECTION = 'CHANGE_STAGE_SELECTION';

export function updateSearchResults(query, results, marketId) {
  return {
    type: INVESTIBLE_SEARCH_RESULTS,
    query,
    results,
    marketId,
  };
}

export function changeStageSelection(selectedStage, marketId){
  return {
    type: CHANGE_STAGE_SELECTION,
    selectedStage,
    marketId
  };
}