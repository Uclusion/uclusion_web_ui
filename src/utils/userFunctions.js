import { PLANNING_TYPE } from '../constants/markets';
import {
  clearUclusionLocalStorage,
  getLoginPersistentItem,
  setLoginPersistentItem,
} from '../components/localStorageUtils';
import TokenStorageManager from '../authorization/TokenStorageManager';
import { Auth } from 'aws-amplify';
import _ from 'lodash';
import { getMarket } from '../contexts/MarketsContext/marketsContextHelper';
import { PLACEHOLDER } from '../constants/global';
import AccountStorageManager from '../authorization/AccountStorageManager';

const LOGOUT_MARKER_KEY = 'logout_marker';

export function extractUsersList(marketPresencesState, marketState, addToMarketPresences) {
  const addToMarketPresencesHash = addToMarketPresences.reduce((acc, presence) => {
    const { external_id } = presence;
    return { ...acc, [external_id]: true };
  }, {});
  return Object.keys(marketPresencesState).reduce((acc, marketId) => {
    const market = getMarket(marketState, marketId) || {};
    const marketPresences = marketPresencesState[marketId] || [];
    if(!Array.isArray(marketPresences) || _.isEmpty(marketPresences) ||
      ['SUPPORT', 'TEST'].includes(market.market_sub_type)||market.market_type !== PLANNING_TYPE) {
      return acc;
    }
    const macc = {};
    marketPresences.forEach((presence) => {
      const {
        id: user_id, name, account_id, external_id, email, market_banned: banned, current_user,
        placeholder_type: placeholderType
      } = presence;
      const isPlaceHolder = placeholderType === PLACEHOLDER;
      if (!isPlaceHolder && !banned && !addToMarketPresencesHash[external_id] && !acc[user_id] && !macc[user_id]) {
        addToMarketPresencesHash[external_id] = true;
        macc[user_id] = {
          user_id, name, account_id, email, external_id, current_user
        };
      }
    });
    return { ...acc, ...macc };
  }, {});
}

export function getMarketInfo(investible, marketId) {
  if (!investible || !investible.market_infos) {
    return {};
  }
  return investible.market_infos.find((info) => info.market_id === marketId);
}

export function isSignedOut() {
  return !_.isEmpty(getLoginPersistentItem(LOGOUT_MARKER_KEY));
}

export function clearSignedOut() {
  setLoginPersistentItem(LOGOUT_MARKER_KEY, '');
}

export function onSignOut() {
  console.info('Signing out');
  // Remove URL in case they log back in as someone else
  window.history.replaceState({}, "Reset", "/");
  setLoginPersistentItem(LOGOUT_MARKER_KEY, 'logged_out');
  // See https://aws-amplify.github.io/docs/js/authentication
  return clearUclusionLocalStorage(false)
    .then(() => new TokenStorageManager().clearTokenStorage())
    .then(() => new AccountStorageManager().clearAccountStorage())
    .then(() => Auth.signOut())
    .then(() => window.location.reload(true));
}

export function getVotesForInvestible(marketPresences, investibleId) {
  return (marketPresences || []).filter(presence => {
    const { investments } = presence;
    if (!Array.isArray(investments) || investments.length === 0) {
      return false;
    }
    let found = false;
    investments.forEach(investment => {
      const { investible_id: invId, deleted } = investment;
      if (invId === investibleId && !deleted) {
        found = true;
      }
    });
    return found;
  });
}
