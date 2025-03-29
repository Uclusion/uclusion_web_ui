import {
  getLoginPersistentItem, getUclusionLocalStorageItem,
  setLoginPersistentItem, setUclusionLocalStorageItem
} from '../components/localStorageUtils';
import _ from 'lodash'
import { getInvestible } from '../contexts/InvestibesContext/investiblesContextHelper';
import { getMarketInfo } from './userFunctions';
import { getMarket } from '../contexts/MarketsContext/marketsContextHelper';
import { PLANNING_TYPE, SUPPORT_SUB_TYPE } from '../constants/markets';

const REDIRECT_LOCAL_STORAGE_KEY = 'redirection';
const WORKSPACE_LOCAL_STORAGE_KEY = 'current_workspace';
const UTM_LOCAL_STORAGE_KEY = 'utm';
const EMAIL_LOCAL_STORAGE_KEY = 'email_storage';
const IS_INVITED = 'is_invited';

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

export function getFirstWorkspace(markets, marketId, allowArchived=true, allowSupport = true) {
  if (_.isEmpty(markets)) {
    return undefined;
  }
  const lastActive = marketId || getCurrentWorkspace();
  const lastMarket = markets.find((workspace) => workspace.id === lastActive &&
    (allowArchived || workspace.market_stage === 'Active')&&
    (allowSupport || workspace.market_sub_type !== SUPPORT_SUB_TYPE));
  return lastMarket || markets[0];
}

export function getGroupForInvestibleId(investibleId, marketId, investiblesState) {
  const inv = getInvestible(investiblesState, investibleId);
  const marketInfo = getMarketInfo(inv, marketId) || {};
  return marketInfo.group_id;
}

export function getPlanningMarketId(investibleId, marketsState, investiblesState) {
  const inv = getInvestible(investiblesState, investibleId);
  if (_.isEmpty(inv?.market_infos)) {
    return undefined;
  }
  const marketInfo = inv.market_infos[0];
  const market = getMarket(marketsState, marketInfo.market_id);
  if (_.isEmpty(market)) {
    return undefined;
  }
  if (market.market_type === PLANNING_TYPE) {
    return market.id;
  }
  return market.parent_comment_market_id;
}

export function setRedirect(location) {
  // The redirect and is_invited are not valid after a logout
  setUclusionLocalStorageItem(REDIRECT_LOCAL_STORAGE_KEY, location);
  if (location.includes('invite')) {
    setUclusionLocalStorageItem(IS_INVITED, true);
  }
}

export function clearRedirect() {
  setUclusionLocalStorageItem(REDIRECT_LOCAL_STORAGE_KEY, undefined);
}

export function setCurrentWorkspace(location) {
  // There is no good reason for this to persist across logout
  setUclusionLocalStorageItem(WORKSPACE_LOCAL_STORAGE_KEY, location);
}

export function setUtm(utm) {
  setLoginPersistentItem(UTM_LOCAL_STORAGE_KEY, utm);
}

export function setEmail(email) {
  setLoginPersistentItem(EMAIL_LOCAL_STORAGE_KEY, email);
}

export function getRedirect() {
  return getUclusionLocalStorageItem(REDIRECT_LOCAL_STORAGE_KEY);
}

export function getIsInvited() {
  return getUclusionLocalStorageItem(IS_INVITED);
}

export function getCurrentWorkspace() {
  return getUclusionLocalStorageItem(WORKSPACE_LOCAL_STORAGE_KEY);
}

export function getEmail() {
  return getLoginPersistentItem(EMAIL_LOCAL_STORAGE_KEY);
}

export function getAndClearEmail() {
  const email = getEmail();
  setLoginPersistentItem(EMAIL_LOCAL_STORAGE_KEY, undefined);
  return email;
}