import _ from 'lodash';

export function addByIdAndVersion (addList, oldList, iteratee = (item) => item.id,
  comparator = (item1, item2) => item1.version >= item2.version) {
  // Cannot allow quick add to clobber something of greater version
  if (_.isEmpty(addList)) {
    return oldList
  }
  // Prevent undefined items from being added
  const addListFiltered = addList.filter((item) => !_.isEmpty(item));
  if (_.isEmpty(addListFiltered)) {
    if (_.isEmpty(oldList)) {
      console.warn('Adding list with empty items');
    }
    return oldList;
  }

  // A sync release can contain several versions of one object. Fold each candidate against the
  // newest one already seen so a lower comparable version cannot displace a newer batch winner.
  const latestById = new Map((oldList || []).map((item) => [iteratee(item), item]));
  const newAddById = new Map();
  addListFiltered.forEach((item) => {
    const id = iteratee(item);
    const latest = latestById.get(id);
    if (!latest || comparator(item, latest)) {
      latestById.set(id, item);
      newAddById.set(id, item);
    }
  })
  return _.unionBy([...newAddById.values()], oldList || [], iteratee)
}

export function removeDeletedObjects(newObjectList, oldObjects) {
  if (_.isEmpty(oldObjects)) {
    return oldObjects // nothing to do
  }
  return oldObjects.filter((object) => {
    return newObjectList.find((item) => item.id === object.id)
  })
}

export function convertDates(item) {
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
export function fixupItemForStorage(item) {
  return convertDates(item)
}

/**
 * Convenience version of fixupItemForStorage that takes an array
 * @param items
 */
export function fixupItemsForStorage(items) {
  return items.map((item) => fixupItemForStorage(item));
}

export function getDeterminateReducer() {
  return (state, action) => {
    const { determinate, checkAll } = state;
    const { type, id } = action;
    let newDeterminate = determinate;
    let newCheckAll = checkAll;
    if (type === 'clear') {
      newDeterminate = {};
      newCheckAll = false;
    } else if (type === 'toggle') {
      newCheckAll = !checkAll;
      // Toggling check all clears all previous
      newDeterminate = {};
    } else if (id !== undefined) {
      const newValue = determinate[id] === undefined ? !checkAll : !determinate[id];
      if (newValue === checkAll) {
        newDeterminate = _.omit(determinate, id);
      } else {
        newDeterminate = { ...determinate, [id]: newValue };
      }
    }
    let newIndeterminate = false;
    Object.keys(newDeterminate).forEach((key) => {
      if (newDeterminate[key] !== newCheckAll) {
        newIndeterminate = true;
      }
    });
    return { determinate: newDeterminate, indeterminate: newIndeterminate, checkAll: newCheckAll };
  }
}
