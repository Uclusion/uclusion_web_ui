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
  indexable.forEach((document) => {
    if (index.has(document)) {
      index.replace(document);
    } else {
      index.add(document);
    }
  });
  const removed = removedRaw.filter((item) => index.has(item));
  // Use discard instead of remove since just id and providing full doc is weird - what if changed?
  index.discardAll(removed);
}