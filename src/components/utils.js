export const getUclusionLocalStorage = () => {
  const key = Object.keys(localStorage).find(e => e.match(/uclusion:root/))
  const data = JSON.parse(localStorage.getItem(key))
  return data;
}

export const getUclusionLocalStorageItem = (subkey) => {
  const key = Object.keys(localStorage).find(e => e.match(/uclusion:root/))
  const data = JSON.parse(localStorage.getItem(key))
  return data[subkey];
}

export const setUclusionLocalStorageItem = (key, value) => {
  const data = getUclusionLocalStorage()
  data[key] = value;
  localStorage.setItem('uclusion:root', JSON.stringify(data));
}