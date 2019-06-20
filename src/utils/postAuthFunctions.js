import { setMarketAuth } from '../components/utils';
import { fetchSelf } from '../api/users';
import { fetchMarket, fetchMarketStages } from '../api/markets';
import { clearReduxStore } from './userStateFunctions';
import { sendInfoPersistent } from './userMessage';
import config from '../config/config';
import { fetchInvestibleList } from '../api/marketInvestibles';
import { fetchCommentList } from '../api/comments';
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
    console.debug(`Current version: ${version}`);
    console.debug(`Upgrading to version: ${currentVersion}`);
    // deprecated, but the simplest way to ignore cache
    const reloader = () => {
      clearReduxStore(dispatch);
      window.location.reload(true);
    };
    sendInfoPersistent({ id: 'noticeNewApplicationVersion' }, {}, reloader);
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
  console.debug(`Fetching investibles with marketId: ${marketId}`);
  const currentInvestibleList = marketId in investibles ? investibles[marketId] : [];
  const currentCommentList = marketId in comments ? comments[marketId] : [];
  let promises = Promise.all([
    fetchInvestibleList(currentInvestibleList, marketId, dispatch),
    fetchMarketStages(marketId, dispatch),
  ]);
  if (fetchComments) {
    promises = promises.then((result) => fetchCommentList(currentCommentList, marketId, dispatch)); //eslint-disable-line
  }
  return promises;
}

export function marketChangeTasks(params, marketId, user) {
  const { dispatch, webSocket } = params;
  // preemptively fetch the market and user, since we're likely to need it
  const promises = fetchMarket(dispatch)
  // fetch the user, and stages to make sure everything is up to date in presences
    .all([fetchSelf(dispatch), fetchMarketStages(marketId, dispatch)])
    .then(() => {
      webSocket.unsubscribeAll();
      return webSocket.subscribe(user.id, { market_id: marketId });
    })
    .then(() => {
      // clear all old subscriptions
      const { investiblesReducer, commentsReducer } = params;
      return fetchMarketInvestibleInfo({
        investibles: getInvestibles(investiblesReducer),
        dispatch,
        comments: getComments(commentsReducer),
        marketId,
      });
    });
  return promises;
}

export function postAuthTasks(params, deployedVersion, uclusionTokenInfo, marketId, user) {
  const { usersReducer, dispatch, webSocket } = params;
  setMarketAuth(marketId, uclusionTokenInfo);
  notifyNewApplicationVersion(dispatch, deployedVersion);
  // if we're not sure the user is the same as we loaded redux with, zero out redux
  if (!usersReducer || !usersReducer.currentUser || usersReducer.currentUser.id !== user.id) {
    console.debug('Clearing user redux');
    webSocket.unsubscribeAll();
    clearReduxStore(dispatch);
  }
  marketChangeTasks(params, marketId, user);
}
