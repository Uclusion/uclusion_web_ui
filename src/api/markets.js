import { getClient } from '../config/uclusionClient';
import { ERROR, sendIntlMessage, SUCCESS } from '../utils/userMessage';
import {
  followedMarket, receiveMarket,
} from '../store/Markets/actions';

export function followUnfollowMarket(marketId, following, dispatch) {
  const clientPromise = getClient();
  return clientPromise.then(client => client.markets.followMarket(following))
    .then((response) => {
      dispatch(followedMarket(marketId, response.following));
      const followMsg = response.following ? 'marketFollowSuccess' : 'marketUnfollowSuccess';
      sendIntlMessage(SUCCESS, { id: followMsg });
    }).catch((error) => {
      console.error(error);
      sendIntlMessage(ERROR, { id: 'marketFollowFailed' });
    });
}

export function fetchMarket(dispatch) {
  const clientPromise = getClient();
  return clientPromise.then(client => client.markets.get())
    .then((market) => {
      dispatch(receiveMarket(market));
    }).catch((error) => {
      console.error(error);
    });
}
