import { getLoginPersistentItem, setLoginPersistentItem } from '../components/localStorageUtils';
import _ from 'lodash'

const REDIRECT_LOCAL_STORAGE_KEY = 'redirection';
const WORKSPACE_LOCAL_STORAGE_KEY = 'current_workspace';
const UTM_LOCAL_STORAGE_KEY = 'utm';
const EMAIL_LOCAL_STORAGE_KEY = 'email_storage';

export function redirectFromHistory(history) {
  const { location } = history;
  const { pathname, hash, } = location;
  let redirect;
  if (pathname !== '/') {
    // we came here by some other link and need to log in
    redirect = pathname;
    if (hash) {
      redirect += hash;
    }
  }
  return redirect;
}

export function getFirstWorkspace(planningDetails) {
  if (_.isEmpty(planningDetails)) {
    return undefined;
  }
  const lastActive = getCurrentWorkspace();
  if (planningDetails.find((workspace) => workspace.id === lastActive)) {
    return lastActive;
  }
  return planningDetails[0].id;
}

export function setRedirect(location) {
  setLoginPersistentItem(REDIRECT_LOCAL_STORAGE_KEY, location);
}

export function clearRedirect() {
  setLoginPersistentItem(REDIRECT_LOCAL_STORAGE_KEY, undefined);
}

export function setCurrentWorkspace(location) {
  setLoginPersistentItem(WORKSPACE_LOCAL_STORAGE_KEY, location);
}

export function setUtm(utm) {
  setLoginPersistentItem(UTM_LOCAL_STORAGE_KEY, utm);
}

export function setEmail(email) {
  setLoginPersistentItem(EMAIL_LOCAL_STORAGE_KEY, email);
}

export function getRedirect() {
  return getLoginPersistentItem(REDIRECT_LOCAL_STORAGE_KEY);
}

export function getCurrentWorkspace() {
  return getLoginPersistentItem(WORKSPACE_LOCAL_STORAGE_KEY);
}

export function getUtm() {
  return getLoginPersistentItem(UTM_LOCAL_STORAGE_KEY);
}

export function getEmail() {
  return getLoginPersistentItem(EMAIL_LOCAL_STORAGE_KEY);
}

export function getAndClearEmail() {
  const email = getEmail();
  setLoginPersistentItem(EMAIL_LOCAL_STORAGE_KEY, undefined);
  return email;
}