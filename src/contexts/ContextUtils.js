import _ from 'lodash';

function getOutdatedObjectIds(currentList, oldList) {
  // if we don't have market details we're starting from empty, so everything is needed
  if (_.isEmpty(oldList)) {
    return currentList;
  }
  const outOfDate = [];
  const oldListMap = _.keyBy(oldList, 'id');
  currentList.forEach((item) => {
    const { id } = item;
    const oldItem = oldListMap[id];
    if (!oldItem || (item.updated_at > oldItem.updated_at)) {
      outOfDate.push(id);
    }
  });
  return outOfDate;
}

function removeDeletedObjects(newObjectList, oldObjects) {
  if (_.isEmpty(oldObjects)) {
    return oldObjects; // nothing to do
  }
  const existingObjects = oldObjects.filter((object) => {
    const found = newObjectList.find(item => item.id === object.id);
    return found;
  });
  return existingObjects;
}

function convertDates(item) {
  const { created_at, updated_at } = item;
  const newItem = {
    ...item,
    created_at: new Date(created_at),
    updated_at: new Date(updated_at),
  };
  return newItem;
}

export { getOutdatedObjectIds, removeDeletedObjects, convertDates };