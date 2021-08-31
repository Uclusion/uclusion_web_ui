import _ from 'lodash';

function addByIdAndVersion (addList, oldList, iteratee = (item) => item.id,
  comparator = (item1, item2) => item1.version >= item2.version) {
  // Cannot allow quick add to clobber something of greater version
  if (_.isEmpty(oldList)) {
    return addList
  }
  if (_.isEmpty(addList)) {
    return oldList
  }
  const newAddList = []
  const oldListMap = _.keyBy(oldList, iteratee)
  addList.forEach((item) => {
    const oldItem = oldListMap[iteratee(item)]
    if (!oldItem || comparator(item, oldItem)) {
      newAddList.push(item)
    }
  })
  return _.unionBy(newAddList, oldList, iteratee)
}

function removeDeletedObjects(newObjectList, oldObjects) {
  if (_.isEmpty(oldObjects)) {
    return oldObjects // nothing to do
  }
  return oldObjects.filter((object) => {
    return newObjectList.find((item) => item.id === object.id)
  })
}

function convertDates(item) {
  const { created_at, updated_at } = item;
  return {
    ...item,
    created_at: new Date(created_at),
    updated_at: new Date(updated_at),
  }
}


/**
 * Items from the backend are not quite ready to be displayed on the front end
 * this function performs all manipulations required to format an item
 * from the backend for use on the frontend.
 * @param item
 */
function fixupItemForStorage(item) {
  return convertDates(item)
}


/**
 * Convenience version of fixupItemForStorage that takes an array
 * @param items
 */
function fixupItemsForStorage(items) {
  return items.map((item) => fixupItemForStorage(item));
}

export {
  addByIdAndVersion, removeDeletedObjects, fixupItemsForStorage, fixupItemForStorage, convertDates,
}
