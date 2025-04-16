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
  const removed = _.remove(indexable, (item) => item.type === 'DELETED');
  index.addAll(indexable);
  index.removeAll(removed);
}