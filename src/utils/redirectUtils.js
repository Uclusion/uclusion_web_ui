import {
  getLoginPersistentItem,
  setLoginPersistentItem,
  setUclusionLocalStorageItem
} from '../components/localStorageUtils'
import _ from 'lodash'
import { getInvestible } from '../contexts/InvestibesContext/investiblesContextHelper';
import { getMarketInfo } from './userFunctions';

const REDIRECT_LOCAL_STORAGE_KEY = 'redirection';
const WORKSPACE_LOCAL_STORAGE_KEY = 'current_workspace';
const GROUP_LOCAL_STORAGE_KEY = 'current_group';
const UTM_LOCAL_STORAGE_KEY = 'utm';
const EMAIL_LOCAL_STORAGE_KEY = 'email_storage';
export const IS_INVITED = 'is_invited';

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

export function getFirstWorkspace(markets, marketId) {
  if (_.isEmpty(markets)) {
    return undefined;
  }
  const lastActive = marketId || getCurrentWorkspace();
  const lastMarket = markets.find((workspace) => workspace.id === lastActive);
  return lastMarket || markets[0];
}

export function getGroupForInvestibleId(investibleId, marketId, investiblesState) {
  const inv = getInvestible(investiblesState, investibleId);
  const marketInfo = getMarketInfo(inv, marketId) || {};
  return marketInfo.group_id;
}

export function getFirstGroup(groupState, marketId) {
  const groupDetails = groupState[marketId] || [];
  if (_.isEmpty(groupDetails)) {
    return marketId;
  }
  const lastActive = getCurrentGroup();
  if (groupDetails.find((group) => group.id === lastActive)) {
    return lastActive;
  }
  return marketId;
}

export function setRedirect(location) {
  setLoginPersistentItem(REDIRECT_LOCAL_STORAGE_KEY, location);
  // The only way you have a redirect is if you are part of some workspace already
  setUclusionLocalStorageItem(IS_INVITED, true);
}

export function clearRedirect() {
  setLoginPersistentItem(REDIRECT_LOCAL_STORAGE_KEY, undefined);
}

export function setCurrentWorkspace(location) {
  setLoginPersistentItem(WORKSPACE_LOCAL_STORAGE_KEY, location);
}

export function setCurrentGroup(location) {
  setLoginPersistentItem(GROUP_LOCAL_STORAGE_KEY, location);
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

export function getCurrentGroup() {
  return getLoginPersistentItem(GROUP_LOCAL_STORAGE_KEY);
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