import _ from 'lodash';
import { transformItemsToIndexable } from './searchIndexContextMessages';

export function getSearchResults(index, query, marketId) {
  let result;
  if (marketId) {
    result = index.search(query, {
      filter: (result) => result.marketId === marketId
    });
  } else {
    result = index.search(query);
  }
  return result;
}

export function addToIndex(index, itemType, items) {
  const indexable = transformItemsToIndexable(itemType, items);
  const removedRaw = _.remove(indexable, (item) => item.type === 'DELETED');
  const toAdd = [];
  const beforeTimestamp = Date.now();
  indexable.forEach((document) => {
    if (index.has(document.id)) {
      index.replace(document);
    } else {
      toAdd.push(document);
    }
  });
  index.addAll(toAdd);
  const removed = removedRaw.filter((item) => index.has(item.id));
  // Use discard instead of remove since just id and providing full doc is weird - what if changed?
  index.discardAll(removed);
  const afterTimestamp = Date.now();
  console.info(`Minisearch add to index took ${afterTimestamp - beforeTimestamp} for ${_.size(items)} items`);
}