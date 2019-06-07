import { fetchUser } from '../store/Users/actions';

import { setMarketAuth } from '../components/utils';
import { fetchMarket, fetchMarketStages } from '../api/markets;
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
export function notifyNewApplicationVersion(dispatch, currentVersion) {
  const { version } = config;
  // if we don't have any version stored, we're either in dev, or we've dumped our data
  if (currentVersion !== version) {
    console.debug('Current version ' + version);
    console.debug('Upgrading to version ' + currentVersion);
    // deprecated, but the simplest way to ignore cache
    const reloader = () => {
      clearReduxStore(dispatch);
      window.location.reload(true); };
    sendInfoPersistent({ id: 'noticeNewApplicationVersion' }, {}, reloader);

    //  window.location.reload(true);
  }
}

/**
 * Returns a promise that when resolved will fetch all needed investible info
 * @param params
 * @returns {*}
 */
export function fetchMarketInvestibleInfo(params) {
  const {
    investibles, dispatch, comments, marketId, fetchComments,
  } = params;
  console.debug('Fetching investibles with marketId:', marketId);
  const currentInvestibleList = marketId in investibles ? investibles[marketId] : [];
  const currentCommentList = marketId in comments ? comments[marketId] : [];
  let promises = fetchInvestibleList(currentInvestibleList)
    .then(result => fetchMarketStages());
  if (fetchComments) {
    promises = promises.then((result) => fetchCommentList(currentCommentList));
  }
  return promises;
}

export function marketChangeTasks(params, market_id, user) {
  const { dispatch, webSocket } = params;
  // preemptively fetch the market and user, since we're likely to need it
  dispatch(fetchMarket({ market_id, user }));
  // fetch the user, to make sure everything lines up with the auth market
  dispatch(fetchUser({ marketId: market_id }));
  dispatch(fetchMarketStages({ marketId: market_id }));
  //clear all old subscriptions
  webSocket.unsubscribeAll();
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
  const { usersReducer, dispatch, webSocket } = params;
  setMarketAuth(market_id, uclusionTokenInfo);
  notifyNewApplicationVersion(dispatch, deployedVersion);
  // if we're not sure the user is the same as we loaded redux with, zero out redux
  if (!usersReducer || !usersReducer.currentUser || usersReducer.currentUser.id !== user.id) {
    console.debug('Clearing user redux');
    webSocket.unsubscribeAll();
    clearReduxStore(dispatch);
  }
  marketChangeTasks(params, market_id, user);
}
