export const INVESTIBLE_SEARCH_RESULTS = 'INVESTIBLE_SEARCH_RESULTS';

export function updateSearchResults(query, results, marketId) {
  return {
    type: INVESTIBLE_SEARCH_RESULTS,
    query,
    results,
    marketId,
  };
}
