import { getLoginPersistentItem, setLoginPersistentItem } from '../components/localStorageUtils';
import queryString from 'query-string'

const REDIRECT_LOCAL_STORAGE_KEY = 'redirection';
const LAST_WORKSPACE_LINK_LOCAL_STORAGE_KEY = 'last_workspace_link';
const WORKSPACE_LOCAL_STORAGE_KEY = 'current_workspace';
const UTM_LOCAL_STORAGE_KEY = 'utm';
const EMAIL_LOCAL_STORAGE_KEY = 'email_storage';
const INVITATION_MARKER_STORAGE_KEY = 'invitation_marker';

export function redirectFromHistory(history) {
  const { location } = history;
  const { pathname, hash, search } = location;
  const values = queryString.parse(search || '');
  const { subscribeId } = values || {};
  let redirect;
  if (pathname !== '/') {
    // we came here by some other link and need to log in
    redirect = pathname;
    if (subscribeId) {
      redirect += `?subscribeId=${subscribeId}`;
    }
    if (hash) {
      redirect += hash;
    }
  }
  return redirect;
}

export function getFirstWorkspace(planningDetails) {
  const lastActive = getCurrentWorkspace();
  if (planningDetails.find((workspace) => workspace.id === lastActive)) {
    return lastActive;
  }
  return planningDetails[0].id;
}

export function getLastWorkspaceLink() {
  return getLoginPersistentItem(LAST_WORKSPACE_LINK_LOCAL_STORAGE_KEY);
}

export function setLastWorkspaceLink(location) {
  setLoginPersistentItem(LAST_WORKSPACE_LINK_LOCAL_STORAGE_KEY, location);
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

export function setInvitationMarker() {
  setLoginPersistentItem(INVITATION_MARKER_STORAGE_KEY, 'invited');
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

export function getInvitationMarker() {
  return getLoginPersistentItem(INVITATION_MARKER_STORAGE_KEY);
}

export function getEmail() {
  return getLoginPersistentItem(EMAIL_LOCAL_STORAGE_KEY);
}

export function getAndClearEmail() {
  const email = getEmail();
  setLoginPersistentItem(EMAIL_LOCAL_STORAGE_KEY, undefined);
  return email;
}