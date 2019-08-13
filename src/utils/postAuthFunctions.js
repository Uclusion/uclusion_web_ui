
import { clearReduxStore } from './userStateFunctions';
import { sendInfoPersistent } from './userMessage';
import config from '../config/config';
import { fetchInvestibleList } from '../api/marketInvestibles';
import { fetchCommentList } from '../api/comments';
import useMarketContext from '../contexts/useMarketsContext';
import { getActiveMarkeList } from '../api/sso';


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
  let promises = fetchInvestibleList(currentInvestibleList, marketId, dispatch);
  if (fetchComments) {
    promises = promises.then((result) => fetchCommentList(currentCommentList, marketId, dispatch)); //eslint-disable-line
  }
  return promises;
}




export function postAuthTasks() {

}
