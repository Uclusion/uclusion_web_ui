import _ from 'lodash';
import { fixUploadedFileLinks } from '../api/files';
import { updateFileToken } from '../authorization/tokenStorageUtils';

function getOutdatedObjectIds(currentList, oldList) {
  // if we don't have market details we're starting from empty, so everything is needed
  if (_.isEmpty(oldList)) {
    return currentList.map((item) => item.id);
  }
  const outOfDate = [];
  const oldListMap = _.keyBy(oldList, 'id');
  currentList.forEach((item) => {
    const { id } = item;
    const oldItem = oldListMap[id];
    if (!oldItem || (item.version > oldItem.version)) {
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
    const found = newObjectList.find((item) => item.id === object.id);
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

function fixFileLinks(item) {
  const { body, description } = item;
  // contexts either have a body or a description
  const text = body || description;
  const newText = fixUploadedFileLinks(text);
  if (body) {
    return {
      ...item,
      body: newText,
    };
  }
  return {
    ...item,
    description: newText,
  };
}

/**
 * Items from the backend are not quite ready to be displayed on the front end
 * this function performs all manipulations required to format an item
 * from the backend for use on the frontend.
 * @param item
 */
function fixupItemForStorage(item) {
  const dateConverted = convertDates(item);
  if (item.uploaded_files) {
    // console.debug(`Updating file tokens for id ${item.id} with ${item.uploaded_files}`);
    item.uploaded_files.forEach((uploadedFile) => {
      const { uclusion_token, path } = uploadedFile;
      // console.debug(`Installing token [${uclusion_token}] for path ${path}`);
      updateFileToken(path, uclusion_token);
    });
    const fixed = fixFileLinks(dateConverted);
    return fixed;
  }
  return dateConverted;
}


/**
 * Convenience version of fixupItemForStorage that takes an array
 * @param items
 */
function fixupItemsForStorage(items) {
  return items.map((item) => fixupItemForStorage(item));
}

export {
  getOutdatedObjectIds, removeDeletedObjects, fixupItemsForStorage, fixupItemForStorage, convertDates,
};
