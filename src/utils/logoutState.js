import _ from 'lodash';
import {
  getLoginPersistentItem,
  setLoginPersistentItem,
} from '../components/localStorageUtils';

const LOGOUT_MARKER_KEY = 'logout_marker';
const LOGIN_GENERATION_STORAGE_KEY = 'uclusion:loginGeneration';

function createLoginGeneration() {
  if (window.crypto?.getRandomValues) {
    const values = new Uint32Array(4);
    window.crypto.getRandomValues(values);
    return Array.from(values, (value) => value.toString(16).padStart(8, '0')).join('');
  }
  return `${Date.now()}-${Math.random()}`;
}

export function getLogoutGeneration() {
  return localStorage.getItem(LOGIN_GENERATION_STORAGE_KEY);
}

export function isLogoutGenerationCurrent(generation) {
  return generation === getLogoutGeneration();
}

export function isSignedOut() {
  return !_.isEmpty(getLoginPersistentItem(LOGOUT_MARKER_KEY));
}

export function clearSignedOut() {
  localStorage.setItem(LOGIN_GENERATION_STORAGE_KEY, createLoginGeneration());
  setLoginPersistentItem(LOGOUT_MARKER_KEY, '');
}

export function markSignedOut() {
  setLoginPersistentItem(LOGOUT_MARKER_KEY, 'logged_out');
}
