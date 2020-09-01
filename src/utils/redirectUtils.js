import { getLoginPersistentItem, setLoginPersistentItem } from '../components/utils';

const REDIRECT_LOCAL_STORAGE_KEY = 'redirection';
const UTM_LOCAL_STORAGE_KEY = 'utm';

export function setRedirect(location) {
  setLoginPersistentItem(REDIRECT_LOCAL_STORAGE_KEY, location);
}

export function setUtm(utm) {
  setLoginPersistentItem(UTM_LOCAL_STORAGE_KEY, utm);
}

export function getRedirect() {
  return getLoginPersistentItem(REDIRECT_LOCAL_STORAGE_KEY);
}

export function getUtm() {
  return getLoginPersistentItem(UTM_LOCAL_STORAGE_KEY);
}

export function getAndClearRedirect() {
  const redirect = getRedirect();
  setLoginPersistentItem(REDIRECT_LOCAL_STORAGE_KEY, undefined);
  return redirect;
}

export function redirectToPath(history, subPath) {
  history.push(subPath);
}