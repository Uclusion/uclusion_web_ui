import { getClient } from '../config/uclusionClient';
import { ERROR, sendIntlMessage, SUCCESS } from '../utils/userMessage';
import { receiveMarketCategories } from '../store/Markets/actions';
import { updateInChunks } from '../store/reducer_helpers';
import { updateInvestibleDetailInvestment } from '../store/Detail/actions';
import { fetchSelf } from './users';
import {
  investibleCreated, investibleDeleted,
  investibleFollowed,
  investmentCreated, marketInvestibleCreated,
  receiveInvestibleList,
  receiveInvestibles
} from '../store/MarketInvestibles/actions';

export function followUnfollowInvestible(investible, stopFollowing, dispatch) {
  const clientPromise = getClient();
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
  const clientPromise = getClient();
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
  const clientPromise = getClient();
  console.debug(`Fetching investibles list for: ${marketId}`);
  return clientPromise.then(client => client.markets.listInvestibles())
    .then((response) => {
      const { investibles, categories } = response;
      dispatch(receiveMarketCategories(categories, marketId));
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

export function createInvestment(teamId, investibleId, quantity, dispatch) {
  const clientPromise = getClient();
  return clientPromise.then(client => client.markets.createInvestment(teamId, investibleId, quantity))
    .then((investment) => {
      dispatch(investmentCreated(investment));
      sendIntlMessage(SUCCESS, { id: 'investmentSucceeded' }, { shares: quantity });
      dispatch(updateInvestibleDetailInvestment(investment));
      return fetchSelf(dispatch);
    }).catch((error) => {
      console.error(error);
      sendIntlMessage(ERROR, { id: 'investibleListFetchFailed' });
    });
}

function createNewBoundInvestible(params, dispatch) {
  const {
    canInvest,
    teamId,
    investibleId,
    quantity,
    categoryList,
  } = params;
  const clientPromise = getClient();
  return clientPromise.then((client) => {
    if (canInvest) {
      return client.markets.investAndBind(teamId, investibleId, quantity, categoryList);
    }
    return client.investibles.bindToMarket(investibleId, categoryList);
  }).then((response) => {
    const investible = response.investible ? response.investible : response;
    investible.copiedInvestibleId = investibleId;
    dispatch(marketInvestibleCreated(response.investment, investible));
    sendIntlMessage(SUCCESS, { id: 'investibleAddSucceeded' });
    return fetchSelf(dispatch);
  });
}

/**
 * Creates a market investible
 * @param params a package of arguments including the title, description, quantity etc
 * @param dispatch the dispatch to redux
 * @returns {Q.Promise<any> | * | Promise<T | never>}
 */
export function createMarketInvestible(params, dispatch) {
  const { title, description } = params;
  const clientPromise = getClient();
  return clientPromise.then(client => client.investibles.create(title, description))
    .then((investible) => {
      dispatch(investibleCreated(investible));
      // inform the invest they need to fetch the new market investible
      const payload = {
        teamId: params.teamId,
        investibleId: investible.id,
        quantity: params.quantity,
        categoryList: [params.category],
        canInvest: params.canInvest,
      };
      return createNewBoundInvestible(payload);
    }).catch((error) => {
      // eslint-disable-next-line no-console
      console.error(error);
      sendIntlMessage(ERROR, { id: 'investibleAddFailed' });
      dispatch(investibleCreated([]));
    });
}

export function deleteMarketInvestible(investibleId, marketId, dispatch){
  const clientPromise = getClient();
  return clientPromise.then(client => client.investibles.delete(investibleId))
    .then(() => {
      dispatch(investibleDeleted(marketId, investibleId));
      sendIntlMessage(SUCCESS, { id: 'marketInvestibleDeleted' });
    }).catch((error) => {
      console.log(error);
      sendIntlMessage(ERROR, { id: 'marketInvestibleDeleteFailed' });
    });
}
