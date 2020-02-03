import _ from 'lodash';
  const ROOT = 'uclusion:root';

export const getUclusionLocalStorage = () => {
  const storage = localStorage.getItem(ROOT);
  if (_.isEmpty(storage)) {
    return {};
  }
  return JSON.parse(storage);
};

export const getUclusionLocalStorageItem = (key) => {
  const data = getUclusionLocalStorage();
  return data && key in data ? data[key] : null;
};

export const clearUclusionLocalStorage = () => {
  localStorage.setItem(ROOT, '');
};

export const setUclusionLocalStorageItem = (key, value) => {
  let data = getUclusionLocalStorage();
  if (!data) {
    data = {};
  }
  if (value) {
    data[key] = value;
  } else {
    delete data[key];
  }
  localStorage.setItem(ROOT, JSON.stringify(data));
};

