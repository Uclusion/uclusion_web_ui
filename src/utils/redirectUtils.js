import { getUclusionLocalStorageItem, setUclusionLocalStorageItem } from '../components/utils';

const REDIRECT_LOCAL_STORAGE_KEY = 'redirection';

export function setRedirect(location) {
  setUclusionLocalStorageItem(REDIRECT_LOCAL_STORAGE_KEY, location);
}

export function getRedirect() {
  return getUclusionLocalStorageItem(REDIRECT_LOCAL_STORAGE_KEY);
}

export function getAndClearRedirect() {
  const redirect = getRedirect();
  setUclusionLocalStorageItem(REDIRECT_LOCAL_STORAGE_KEY, undefined);
  return redirect;
}

export function redirectToPath(subPath) {
  const url = new URL(window.location.href);
  url.pathname = subPath;
  url.search = '';
  console.debug(`redirecting you to ${url.toString()}`);
  window.location.href = url.toString();
}