import { fetchUser } from '../store/Users/actions';

import { setUclusionLocalStorageItem } from '../components/utils';
import { fetchMarket, fetchMarketStages } from '../store/Markets/actions';
import { clearReduxStore } from './userStateFunctions';
import { sendInfoPersistent } from './userMessage';
import config from '../config/config';
import { fetchInvestibleList } from '../store/MarketInvestibles/actions';
import { fetchCommentList } from '../store/Comments/actions';
import { getInvestibles } from '../store/MarketInvestibles/reducer';
import { getComments } from '../store/Comments/reducer';

/**
 * Checks the current application version against the version of the application
 * we have stored in the state. If they don't match, force reloads the page.
 * @param currentVersion
 */
export function notifyNewApplicationVersion(currentVersion) {
  const { version } = config;
  // if we don't have any version stored, we're either in dev, or we've dumped our data
  if (currentVersion !== version) {
    console.debug('Current version ' + version);
    console.debug('Upgrading to version ' + currentVersion);
    // deprecated, but the simplest way to ignore cache
    const reloader = () => { window.location.reload(true); };
    sendInfoPersistent({ id: 'noticeNewApplicationVersion' }, {}, reloader);

    //  window.location.reload(true);
  }
}

export function fetchMarketInvestibleList(params) {
  const {
    investibles, dispatch, comments, marketId, fetchComments,
  } = params;
  console.debug('Fetching investibles with marketId:', marketId);
  const currentInvestibleList = marketId in investibles ? investibles[marketId] : [];
  const currentCommentList = marketId in comments ? comments[marketId] : [];
  dispatch(fetchInvestibleList({ marketId, currentInvestibleList }));
  dispatch(fetchMarketStages({ marketId }));
  if (fetchComments) {
    dispatch(fetchCommentList({ marketId, currentCommentList }));
  }
}

export function marketChangeTasks(params, market_id, user) {
  const { dispatch, webSocket } = params;
  // preemptively fetch the market and user, since we're likely to need it
  dispatch(fetchMarket({ market_id, user }));
  // fetch the user, to make sure everything lines up with the auth market
  dispatch(fetchUser({ marketId: market_id }));
  dispatch(fetchMarketStages({ marketId: market_id }));
  webSocket.subscribe(user.id, { market_id });
  const { investiblesReducer, commentsReducer } = params;
  fetchMarketInvestibleList({
    investibles: getInvestibles(investiblesReducer),
    dispatch,
    comments: getComments(commentsReducer),
    marketId: market_id,
  });
}

export function postAuthTasks(params, deployedVersion, uclusionTokenInfo, market_id, user) {
  const { usersReducer, dispatch } = params;
  const { token, type } = uclusionTokenInfo;
  const authInfo = { token, type };
  setUclusionLocalStorageItem('auth', authInfo);
  notifyNewApplicationVersion(deployedVersion);
  // if we're not sure the user is the same as we loaded redux with, zero out redux
  if (!usersReducer || !usersReducer.currentUser || usersReducer.currentUser.id !== user.id) {
    console.debug('Clearing user redux');
    clearReduxStore(dispatch);
  }
  marketChangeTasks(params, market_id, user);
}


