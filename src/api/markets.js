import { getClient } from '../config/uclusionClient';
import { ERROR, sendIntlMessage, SUCCESS } from '../utils/userMessage';
import {
  categoryCreated,
  categoryDeleted,
  followedMarket,
  followedMarketStage, receiveMarket,
  receiveMarketCategories,
  receiveMarketStages,
} from '../store/Markets/actions';

export function followUnfollowMarket(following, dispatch) {
  const clientPromise = getClient();
  return clientPromise.then(client => client.markets.followMarket(following))
    .then((response) => {
      dispatch(followedMarket(response.following));
      const followMsg = response.following ? 'marketFollowSuccess' : 'marketUnfollowSuccess';
      sendIntlMessage(SUCCESS, { id: followMsg });
    }).catch((error) => {
      console.error(error);
      sendIntlMessage(ERROR, { id: 'marketFollowFailed' });
    });
}


export function followUnFollowMarketStage(stageId, following, dispatch) {
  const clientPromise = getClient();
  return clientPromise.then(client => client.markets.followStage(stageId, following))
    .then((response) => {
      dispatch(followedMarketStage(stageId, response.following));
      const followMsg = response.following ? 'stageFollowSuccess' : 'stageUnfollowSuccess';
      sendIntlMessage(SUCCESS, { id: followMsg });
    }).catch((error) => {
      sendIntlMessage(error, { id: 'stageFollowFailed' });
    });
}


export function fetchMarketStages(dispatch) {
  const clientPromise = getClient();
  console.debug('Fetching market stages');
  return clientPromise.then(client => client.markets.listStages())
    .then((stageList) => {
      dispatch(receiveMarketStages(stageList));
    }).catch((error) => {
      console.error(error);
    });
}

export function fetchMarketCategories(dispatch) {
  const clientPromise = getClient();
  console.debug('Fetching market categories');
  return clientPromise.then(client => client.markets.listInvestibles())
    .then((response) => {
      const { categories } = response;
      dispatch(receiveMarketCategories(categories));
    }).catch((error) => {
      console.error(error);
      dispatch(receiveMarketCategories({}));
    });
}

export function deleteMarketCategory(name, dispatch) {
  const clientPromise = getClient();
  return clientPromise.then(client => client.investibles.deleteCategory(name))
    .then((deleted) => {
      dispatch(categoryDeleted(name));
      sendIntlMessage(SUCCESS, { id: 'marketCategoryDeleted' });
    }).catch((error) => {
      console.error(error);
      sendIntlMessage(ERROR, { id: 'marketCategoryDeleteFailed' });
    });
}

export function createMarketCategory(name, dispatch) {
  const clientPromise = getClient();
  return clientPromise.then(client => client.investibles.createCategory(name))
    .then((category) => {
      const newCategory = { ...category, investiblesIn: 0 };
      dispatch(categoryCreated(newCategory));
      sendIntlMessage(SUCCESS, { id: 'marketCategoryCreated' });
    }).catch((error) => {
      console.error(error);
      sendIntlMessage(ERROR, { id: 'marketCategoryCreateFailed' });
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

