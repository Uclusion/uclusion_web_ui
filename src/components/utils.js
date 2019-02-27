export const getUclusionLocalStorage = () => {
  const key = Object.keys(localStorage).find(e => e.match(/uclusion:root/));
  const data = JSON.parse(localStorage.getItem(key));
  return data;
};

export const getUclusionLocalStorageItem = (subkey) => {
  const key = Object.keys(localStorage).find(e => e.match(/uclusion:root/));
  const data = JSON.parse(localStorage.getItem(key));
  return data && subkey in data ? data[subkey] : null;
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
  localStorage.setItem('uclusion:root', JSON.stringify(data));
};
