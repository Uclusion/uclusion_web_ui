import _ from 'lodash';

/**
 * Wallks the currentItems and newItems list comparing the IDS and last updated times
 * with each other. Returns the list of items from the newItemsList that will require
 * a full fetch
 * @param currentItems the current list of items we have
 * @param newItemsList the list of new items (with updated date) t
 * @returns {*[]} the subList of newItemsList that need updating
 */
export function determineNeedsUpdate(currentItems, newItemsList) {
  const currentHash = _.keyBy(currentItems, item => item.id);
  const updateNeeded = _.filter(newItemsList, (item) => {
    const stateVersion = currentHash[item.id];
    return !stateVersion || (stateVersion.updated_at < new Date(item.updated_at));
  });
  return updateNeeded.map(item => item.id);
}

/**
 * Helper function to abstract chunking downloads
 * @param dispatch the dispatch to the store
 * @param currentItemList the current list of items we have
 * @param newItemList the new list of items we've fetched
 * @param fetchFunction the function to call to dispatch to the store
 * @param marketId the id of the market we're working with
 */
export function updateInChunks(dispatch, currentItemList, newItemList, fetchFunction, marketId) {
  const needsUpdate = determineNeedsUpdate(currentItemList, newItemList);
  const chunks = _.chunk(needsUpdate, 50); // hard coded to 50 as it's safe
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    dispatch(fetchFunction({ marketId, idList: chunk }));
  }
}


