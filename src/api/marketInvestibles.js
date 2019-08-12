import { getMarketClient } from './uclusionClient';
import { ERROR, sendIntlMessage, SUCCESS } from '../utils/userMessage';
import { updateInChunks } from '../store/reducer_helpers';

import {
  investibleDeleted,
  investibleFollowed,
  investmentUpdated,
  receiveInvestibleList,
  receiveInvestibles
} from '../store/MarketInvestibles/actions';

export function followUnfollowInvestible(investible, stopFollowing, dispatch) {
  const clientPromise = getMarketClient(investible.marketId);
  return clientPromise.then(client => client.investibles.follow(investible.id, stopFollowing))
    .then((result) => {
      dispatch(investibleFollowed(investible, result.following));
      const followMsg = result.following ? 'investibleFollowSuccess' : 'investibleUnfollowSuccess';
      sendIntlMessage(SUCCESS, { id: followMsg });
    }).catch((error) => {
      console.error(error);
      sendIntlMessage(ERROR, { id: 'investibleFollowFailed' });
    });
}

export function fetchInvestibles(idList, marketId, dispatch) {
  const clientPromise = getMarketClient(marketId);
  console.debug(`Fetching idList ${idList}`);
  return clientPromise.then(client => client.markets.getMarketInvestibles(idList))
    .then((investibles) => {
      dispatch(receiveInvestibles(marketId, investibles));
    }).catch((error) => {
      console.error(error);
      sendIntlMessage(ERROR, { id: 'investibleFetchFailed' });
    });
}

export function fetchInvestibleList(currentInvestibleList, marketId, dispatch) {
  const clientPromise = getMarketClient(marketId);
  console.debug(`Fetching investibles list for: ${marketId}`);
  return clientPromise.then(client => client.markets.listInvestibles())
    .then((response) => {
      const { investibles } = response;
      dispatch(receiveInvestibleList(marketId, investibles));
      return updateInChunks(
        dispatch,
        currentInvestibleList,
        investibles,
        fetchInvestibles,
        marketId
      );
    }).catch((error) => {
      console.error(error);
      sendIntlMessage(ERROR, { id: 'investibleListFetchFailed' });
    });
}

export function updateInvestment(teamId, marketId, investibleId, quantity, currentQuantity, dispatch) {
  const clientPromise = getMarketClient(marketId);
  return clientPromise.then(client => client.markets.updateInvestment(teamId, investibleId, quantity, currentQuantity))
    .then((investment) => {
      dispatch(investmentUpdated(marketId, investibleId, quantity));
      sendIntlMessage(SUCCESS, { id: 'investmentSucceeded' }, { shares: quantity });
      return Promise.resolve(true);
    }).catch((error) => {
      console.error(error);
      sendIntlMessage(ERROR, { id: 'investmentFailed' });
    });
}

export function deleteInvestible(investibleId, marketId, dispatch){
  const clientPromise = getMarketClient(marketId);
  return clientPromise.then(client => client.investibles.delete(investibleId))
    .then(() => {
      dispatch(investibleDeleted(marketId, investibleId));
      sendIntlMessage(SUCCESS, { id: 'marketInvestibleDeleted' });
    }).catch((error) => {
      console.log(error);
      sendIntlMessage(ERROR, { id: 'marketInvestibleDeleteFailed' });
    });
}
