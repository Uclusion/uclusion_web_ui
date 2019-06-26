export const getUclusionLocalStorage = () => {
  const key = Object.keys(localStorage).find(e => e.match(/uclusion:root/));
  const data = JSON.parse(localStorage.getItem(key));
  return data;
};

export const getUclusionLocalStorageItem = (key) => {
  const data = getUclusionLocalStorage();
  return data && key in data ? data[key] : null;
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

const authKey = 'auth';

export function clearAuth() {
  setUclusionLocalStorageItem(authKey, null);
}

export function updateMarketAuth(marketId, newInfo) {
  const oldAuthValues = getUclusionLocalStorageItem(authKey) || {};
  const oldMarketValues = oldAuthValues[marketId] || {};
  const newMarketValues = { ...oldMarketValues, ...newInfo };
  const newAuthValues = {...oldAuthValues, [marketId]: newMarketValues };
  setUclusionLocalStorageItem(authKey, newAuthValues);
}

export function getMarketAuth(marketId) {
  const authValues = getUclusionLocalStorageItem(authKey) || {};
  return authValues[marketId];
}
