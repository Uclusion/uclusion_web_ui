import { fetchUser } from '../store/Users/actions';
import { setUclusionLocalStorageItem } from '../components/utils';
import { fetchMarket, fetchMarketStages } from '../store/Markets/actions';
import { clearReduxStore } from './userStateFunctions';



export function marketChangeTasks(dispatch, market_id, user, webSocket) {
  // console.log('Destination ' + destination_page + ' for user ' + JSON.stringify(user))
  // pre-emptively fetch the market and user, since we're likely to need it
  dispatch(fetchMarket({ market_id }));
  // Have the user from login but not the market presences which this fetch user will retrieve
  dispatch(fetchUser({ marketId: market_id, user }));
  dispatch(fetchMarketStages({ marketId: market_id }));
  webSocket.subscribe(user.id, { market_id });
}

export function postAuthTasks(usersReducer, uclusionToken, tokenType, dispatch, market_id, user, webSocket) {
  if (uclusionToken) {
    const authInfo = { token: uclusionToken, type: tokenType };
    setUclusionLocalStorageItem('auth', authInfo);
  }
  // if we're not sure the user is the same as we loaded redux with, zero out redux
  if (!usersReducer || !usersReducer.currentUser || usersReducer.currentUser.id !== user.id) {
    console.debug('Clearing user redux');
    clearReduxStore(dispatch);
  }
  marketChangeTasks(dispatch, market_id, user, webSocket);
}
