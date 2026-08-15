import {
  getLoginPersistentItem, getUclusionLocalStorageItem,
  setLoginPersistentItem, setUclusionLocalStorageItem
} from '../components/localStorageUtils';
import _ from 'lodash'
import { getInvestible } from '../contexts/InvestibesContext/investiblesContextHelper';
import { getMarketInfo } from './userFunctions';
import { getMarket } from '../contexts/MarketsContext/marketsContextHelper';
import { PLANNING_TYPE, SUPPORT_SUB_TYPE, TEST_SUB_TYPE } from '../constants/markets';
import { getComment } from '../contexts/CommentsContext/commentsContextHelper';

const REDIRECT_LOCAL_STORAGE_KEY = 'redirection';
const WORKSPACE_LOCAL_STORAGE_KEY = 'current_workspace';
const GROUP_LOCAL_STORAGE_KEY = 'current_group';
const UTM_LOCAL_STORAGE_KEY = 'utm';
const SIGNUP_MARKET_SUB_TYPE_LOCAL_STORAGE_KEY = 'signup_market_sub_type';
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

export function getFirstWorkspace(markets, marketId, allowArchived=true, allowSupport = true) {
  // J-all-400: the flags must also govern the fallback or a new user whose only market is
  // the support workspace gets it as the root path default
  const allowed = markets?.filter((workspace) =>
    (allowArchived || workspace.market_stage === 'Active')&&
    (allowSupport || workspace.market_sub_type !== SUPPORT_SUB_TYPE));
  if (_.isEmpty(allowed)) {
    return undefined;
  }
  const lastActive = marketId || getCurrentWorkspace();
  const lastMarket = allowed.find((workspace) => workspace.id === lastActive);
  return lastMarket || allowed[0];
}

export function getGroupForInvestibleId(investibleId, marketId, investiblesState) {
  const inv = getInvestible(investiblesState, investibleId);
  const marketInfo = getMarketInfo(inv, marketId) || {};
  return marketInfo.group_id;
}

export function getGroupForCommentId(commentId, marketId, commentState) {
  const comment = getComment(commentState, marketId, commentId);
  return comment?.group_id;
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
  console.info(`Setting redirect to ${location}`);
  // The redirect is not valid after a logout
  setUclusionLocalStorageItem(REDIRECT_LOCAL_STORAGE_KEY, location);
}

export function clearRedirect() {
  setUclusionLocalStorageItem(REDIRECT_LOCAL_STORAGE_KEY, undefined);
}

export function setCurrentWorkspace(location) {
  // There is no good reason for this to persist across logout
  setUclusionLocalStorageItem(WORKSPACE_LOCAL_STORAGE_KEY, location);
}

export function setCurrentGroup(location) {
  // There is no good reason for this to persist across logout
  setUclusionLocalStorageItem(GROUP_LOCAL_STORAGE_KEY, location);
}

export function setUtm(utm) {
  setUclusionLocalStorageItem(UTM_LOCAL_STORAGE_KEY, utm);
}

export function clearUtm() {
  setUclusionLocalStorageItem(UTM_LOCAL_STORAGE_KEY, undefined);
}

export function setSignupMarketSubType(marketSubType) {
  setUclusionLocalStorageItem(
    SIGNUP_MARKET_SUB_TYPE_LOCAL_STORAGE_KEY,
    marketSubType === TEST_SUB_TYPE ? marketSubType : undefined
  );
}

export function syncSignupMarketSubType(authState, marketSubType) {
  if (authState === 'signUp') {
    // An active ordinary signup supersedes a stale automated-test signup.
    // Hidden auth components must leave the marker intact through verification.
    setSignupMarketSubType(marketSubType);
  }
}

export function clearSignupMarketSubType() {
  setUclusionLocalStorageItem(SIGNUP_MARKET_SUB_TYPE_LOCAL_STORAGE_KEY, undefined);
}

export function setEmail(email) {
  setLoginPersistentItem(EMAIL_LOCAL_STORAGE_KEY, email);
}

export function getRedirect() {
  return getUclusionLocalStorageItem(REDIRECT_LOCAL_STORAGE_KEY);
}

export function getCurrentWorkspace() {
  return getUclusionLocalStorageItem(WORKSPACE_LOCAL_STORAGE_KEY);
}

export function getCurrentGroup() {
  return getUclusionLocalStorageItem(GROUP_LOCAL_STORAGE_KEY);
}

export function getUtm() {
  return getUclusionLocalStorageItem(UTM_LOCAL_STORAGE_KEY);
}

export function getSignupMarketSubType() {
  return getUclusionLocalStorageItem(SIGNUP_MARKET_SUB_TYPE_LOCAL_STORAGE_KEY);
}

export function withSignupMarketSubType(marketInfo) {
  const marketSubType = getSignupMarketSubType();
  if (marketSubType !== TEST_SUB_TYPE) {
    return marketInfo;
  }
  return {
    ...marketInfo,
    market_sub_type: marketSubType
  };
}

export function getEmail() {
  return getLoginPersistentItem(EMAIL_LOCAL_STORAGE_KEY);
}

export function getAndClearEmail() {
  const email = getEmail();
  setLoginPersistentItem(EMAIL_LOCAL_STORAGE_KEY, undefined);
  return email;
}
