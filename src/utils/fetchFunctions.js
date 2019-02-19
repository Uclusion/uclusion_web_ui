import { fetchUser } from '../store/Users/actions';
import { setUclusionLocalStorageItem } from '../components/utils';
import { fetchMarket } from '../store/Markets/actions';

export function postAuthTasks(uclusionToken, tokenType, dispatch, market_id, user, webSocket) {
  if (uclusionToken) {
    const authInfo = { token: uclusionToken, type: tokenType };
    setUclusionLocalStorageItem('auth', authInfo);
  }
  // console.log('Destination ' + destination_page + ' for user ' + JSON.stringify(user))
  // pre-emptively fetch the market and user, since we're likely to need it
  dispatch(fetchMarket({ market_id, isSelected: true }));
  // Have the user from login but not the market presences which this fetch user will retrieve
  dispatch(fetchUser({ marketId: market_id, user }));
  webSocket.subscribe(user.id, { market_id });
}
