import { fetchUser } from '../store/Users/actions';

import { setUclusionLocalStorageItem } from '../components/utils';
import { fetchMarket, fetchMarketStages } from '../store/Markets/actions';
import { clearReduxStore } from './userStateFunctions';
import { sendInfoPersistent } from './userMessage';
import config from '../config/config';

/**
 * Checks the current application version against the version of the application
 * we have stored in the state. If they don't match, force reloads the page.
 * @param currentVersion
 */
export function notifyNewApplicationVersion(currentVersion) {
  const { version } = config;
  // if we don't have any version stored, we're either in dev, or we've dumped our data
  if (currentVersion !== config) {
    console.debug('Current version ' + version);
    console.debug('Upgrading to version ' + currentVersion);
    // deprecated, but the simplest way to ignore cache
    const reloader = () => { window.location.reload(true); };
    sendInfoPersistent({ id: 'noticeNewApplicationVersion' }, {}, reloader);

    //  window.location.reload(true);
  }
}

export function marketChangeTasks(dispatch, market_id, userId, webSocket) {
  // console.log('Destination ' + destination_page + ' for user ' + JSON.stringify(user))
  // pre-emptively fetch the market and user, since we're likely to need it
  dispatch(fetchMarket({ market_id }));
  // fetch the user, to make sure everything lines up with the auth market
  dispatch(fetchUser({ marketId: market_id }));
  dispatch(fetchMarketStages({ marketId: market_id }));
  webSocket.subscribe(userId, { market_id });
}

export function postAuthTasks(usersReducer, deployedVersion, uclusionTokenInfo, dispatch, market_id, user, webSocket) {
  console.debug(uclusionTokenInfo);
  const { token, planningToken, type, planningType, planningMarketId, planningUserId } = uclusionTokenInfo;
  const authInfo = { token, type };
  setUclusionLocalStorageItem('auth', authInfo);
  const planningAuthInfo = { token: planningToken, type: planningType };
  setUclusionLocalStorageItem('planningAuth', planningAuthInfo);
  setUclusionLocalStorageItem('planningMarketId', planningMarketId);
  setUclusionLocalStorageItem('planningUserId', planningUserId);
  notifyNewApplicationVersion(deployedVersion);
  // if we're not sure the user is the same as we loaded redux with, zero out redux
  if (!usersReducer || !usersReducer.currentUser || usersReducer.currentUser.id !== user.id) {
    console.debug('Clearing user redux');
    clearReduxStore(dispatch);
  }
  marketChangeTasks(dispatch, market_id, planningUserId, webSocket);

}
