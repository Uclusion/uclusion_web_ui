import _ from 'lodash'
import localforage from 'localforage'
import { toastErrorAndThrow } from '../utils/userMessage'
/*
Keys under context ROOT (standard uclusion local storage) are cleared when the user logs in our out.
Keys under LOGIN_PERSISTENT stick around until cleared by our code
 */
const ROOT = 'uclusion:root';
const LOGIN_PERSISTENT = 'uclusion:loginPersistent';

function getStorage(storageKey) {
  const storage = localStorage.getItem(storageKey);
  if (_.isEmpty(storage)) {
    return {};
  }
  return JSON.parse(storage);
}

export function removeInitializing(state) {
  const { initializing } = state;
  if (initializing) {
    // In case network beats the initialization
    return _.omit(state, ['initializing']);
  }
  return state;
}

function getStorageItem(storageKey, key) {
  const data = getStorage(storageKey);
  return data && key in data ? data[key] : null;
}
export function getUclusionLocalStorageItem(key) {
  return getStorageItem(ROOT, key);
}

export function clearUclusionLocalStorage(doReload=true) {
  const persistent = localStorage.getItem(LOGIN_PERSISTENT);
  localStorage.clear()
  localStorage.setItem(LOGIN_PERSISTENT, persistent);
  localStorage.setItem(ROOT, '');
  return localforage.clear().then(() => {
    if (doReload) {
      console.info('Reloading after clearing cache');
      window.location.reload(true);
    }
  }).catch((error) => toastErrorAndThrow(error, 'errorClearFailed'));
}

function setStorageItem(storageKey, key, value) {
  let data = getStorage(storageKey);
  if (!data) {
    data = {};
  }
  if (value !== undefined && value !== null) {
    if (!key) {
      console.error(`Error for ${storageKey} and ${value}`);
      throw new Error(`Undefined key for value ${value}`);
    }
    data[key] = value;
  } else {
    delete data[key];
  }
  localStorage.setItem(storageKey, JSON.stringify(data));
}

export function setUclusionLocalStorageItem(key, value){
  setStorageItem(ROOT, key, value);
}

export function getLoginPersistentItem(key){
  return getStorageItem(LOGIN_PERSISTENT, key);
}

export function setLoginPersistentItem (key, value){
  setStorageItem(LOGIN_PERSISTENT, key, value);
}

/**
 * Generated a reducer that backs all data with local storage.
 * @param localStorageKey the key to store the data under
 * @param reducer a reducer that outputs new states
 * @returns a tuple containing
 * the transformed reducer that backs all resultant states by the local storage,
 * and any stored initial value for that reducer
 */
export function generateLocalStorageBackedReducer(localStorageKey, reducer) {
  const storageBackedReducer = (state, action) => {
    const newState = reducer(state, action)
    setUclusionLocalStorageItem(localStorageKey, newState)
    return newState
  }
  const storedValue = getUclusionLocalStorageItem(localStorageKey)
  return { storageBackedReducer, storedValue }
}
