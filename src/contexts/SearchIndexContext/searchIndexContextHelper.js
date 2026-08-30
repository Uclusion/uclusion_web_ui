import _ from 'lodash';
import { transformItemsToIndexable } from './searchIndexContextMessages';
import { timeSpan } from '../../utils/renderProfiler';

const indexedIdsByType = new WeakMap();

export function getSearchResults(index, query) {
  return index.search(query);
}

export function addToIndex(index, itemType, items) {
  return timeSpan('minisearchReindex', () => {
    const indexable = transformItemsToIndexable(itemType, items);
    addToIndexTimed(index, indexable);
    const trackedIds = getTrackedIds(index, itemType);
    indexable.forEach((item) => {
      if (item.type === 'DELETED') {
        trackedIds.delete(item.id);
      } else {
        trackedIds.add(item.id);
      }
    });
  });
}

export function replaceIndexItems(index, itemType, items) {
  return timeSpan('minisearchReindex', () => {
    const indexable = transformItemsToIndexable(itemType, items);
    const nextIds = new Set(indexable.filter((item) => item.type !== 'DELETED')
      .map((item) => item.id));
    const trackedIds = getTrackedIds(index, itemType);
    const removedIds = [...trackedIds].filter((id) => !nextIds.has(id) && index.has(id));
    if (!_.isEmpty(removedIds)) {
      index.discardAll(removedIds);
    }
    addToIndexTimed(index, indexable);
    getTrackedIdsByType(index).set(itemType, nextIds);
  });
}

function getTrackedIdsByType(index) {
  let idsByType = indexedIdsByType.get(index);
  if (!idsByType) {
    idsByType = new Map();
    indexedIdsByType.set(index, idsByType);
  }
  return idsByType;
}

function getTrackedIds(index, itemType) {
  const idsByType = getTrackedIdsByType(index);
  let trackedIds = idsByType.get(itemType);
  if (!trackedIds) {
    trackedIds = new Set();
    idsByType.set(itemType, trackedIds);
  }
  return trackedIds;
}

function addToIndexTimed(index, indexable) {
  const removedRaw = indexable.filter((item) => item.type === 'DELETED');
  const activeItems = indexable.filter((item) => item.type !== 'DELETED');
  const toAdd = [];
  const beforeTimestamp = Date.now();
  activeItems.forEach((document) => {
    if (index.has(document.id)) {
      index.replace(document);
    } else {
      toAdd.push(document);
    }
  });
  index.addAll(toAdd);
  const removed = removedRaw.map((item) => item.id).filter((id) => index.has(id));
  // Use discard instead of remove since just id and providing full doc is weird - what if changed?
  index.discardAll(removed);
  const afterTimestamp = Date.now();
  console.info(`Minisearch add to index took ${afterTimestamp - beforeTimestamp} for ${_.size(indexable)} items`);
}
