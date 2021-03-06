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

export function removeInitializing(state, isQuickAdd) {
  const { initializing } = state;
  if (!isQuickAdd && initializing) {
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
  if (value) {
    if (!key) {
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
