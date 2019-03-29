
import { fetchUser } from '../Users/actions';
import { getClient } from '../../config/uclusionClient';
import { sendIntlMessage, ERROR, SUCCESS } from '../../utils/userMessage';
import { updateInChunks } from '../reducer_helpers';
import { receiveMarketCategories } from '../Markets/actions';
import { updateInvestibleDetailInvestment } from '../Detail/actions';

export const RECEIVE_INVESTIBLES = 'RECEIVE_INVESTIBLES';
export const INVEST_INVESTIBLE = 'INVEST_INVESTIBLE';
export const INVESTMENT_CREATED = 'INVESTMENT_CREATED';
export const INVESTIBLE_CREATED = 'INVESTIBLE_CREATED';
export const DELETE_MARKET_INVESTIBLE = 'DELETE_MARKET_INVESTIBLE';
export const MARKET_INVESTIBLE_DELETED = 'MARKET_INVESTIBLE_DELETED';
export const INVESTMENTS_DELETED = 'INVESTMENTS_DELETED';
export const MARKET_INVESTIBLE_CREATED = 'MARKET_INVESTIBLE_CREATED';
export const RECEIVE_MARKET_INVESTIBLE_LIST = 'RECEIVE_MARKET_INVESTIBLE_LIST';
export const INVESTIBLE_FOLLOW_UNFOLLOW = 'INVESTIBLE_FOLLOW_UNFOLLOW';

export const investibleDeleted = (marketId, investibleId) => ({
  type: MARKET_INVESTIBLE_DELETED,
  investibleId,
  marketId,
});

export const investmentsDeleted = (marketId, investibleId, quantity) => ({
  type: INVESTMENTS_DELETED,
  marketId,
  investibleId,
  quantity,
});

export const receiveInvestibles = (marketId, investibles) => ({
  type: RECEIVE_INVESTIBLES,
  investibles,
  marketId,
});

export const investmentCreated = investment => ({
  type: INVESTMENT_CREATED,
  investment,
});

export const marketInvestibleCreated = (investment, marketInvestible) => ({
  type: MARKET_INVESTIBLE_CREATED,
  investment,
  marketInvestible,
});

export const investibleCreated = investible => ({
  type: INVESTIBLE_CREATED,
  investible,
});

export const investibleFollowed = (investible, isFollowing) => ({
  type: INVESTIBLE_FOLLOW_UNFOLLOW,
  investible,
  isFollowing,
});

export const followUnfollowInvestible = (params = {}) => (dispatch) => {
  const { investible, stopFollowing } = params;
  const clientPromise = getClient();
  return clientPromise.then(client => client.investibles.follow(investible.id, stopFollowing))
    .then((result) => {
      dispatch(investibleFollowed(investible, result.following));
    }).catch((error) => {
      console.error(error);
      sendIntlMessage(ERROR, { id: 'investibleFollowFailed' });
    });
};

export const fetchInvestibles = (params = {}) => (dispatch) => {
  const { idList, marketId } = params;
  const clientPromise = getClient();
  console.log(`Fetching idList ${idList}`);
  return clientPromise.then(client => client.markets.getMarketInvestibles(marketId, idList))
    .then((investibles) => {
      dispatch(receiveInvestibles(marketId, investibles));
    }).catch((error) => {
      console.error(error);
      sendIntlMessage(ERROR, { id: 'investibleFetchFailed' });
    });
};

export const fetchInvestibleList = (params = {}) => (dispatch) => {
  const { marketId, currentInvestibleList } = params;
  const clientPromise = getClient();
  console.debug('Fetching investibles list for:', marketId);
  return clientPromise.then(client => client.markets.listInvestibles(marketId))
    .then((response) => {
      const { investibles, categories } = response;
      dispatch(receiveMarketCategories(categories, marketId));
      updateInChunks(dispatch, currentInvestibleList, investibles, fetchInvestibles, marketId);
    }).catch((error) => {
      console.error(error);
      sendIntlMessage(ERROR, { id: 'investibleListFetchFailed' });
    });
};

export const createInvestment = (params = {}) => (dispatch) => {
  const clientPromise = getClient();
  return clientPromise.then(client => client.markets.createInvestment(params.marketId, params.teamId, params.investibleId, params.quantity))
    .then((investment) => {
      dispatch(investmentCreated(investment));
      sendIntlMessage(SUCCESS, { id: 'investmentSucceeded' }, { shares: params.quantity });
      dispatch(updateInvestibleDetailInvestment(investment));
      dispatch(fetchUser({ marketId: params.marketId }));
    }).catch((error) => {
      console.error(error);
      sendIntlMessage(ERROR, { id: 'investibleListFetchFailed' });
    });
};

export const createNewBoundInvestible = (params = {}) => (dispatch) => {
  const clientPromise = getClient();
  return clientPromise.then((client) => {
    if (params.canInvest) {
      return client.markets.investAndBind(params.marketId, params.teamId, params.investibleId, params.quantity, params.categoryList);
    }
    return client.investibles.bindToMarket(params.investibleId, params.marketId, params.categoryList);
  }).then((response) => {
    const investible = response.investible ? response.investible : response;
    investible.copiedInvestibleId = params.investibleId;
    dispatch(marketInvestibleCreated(response.investment, investible));
    sendIntlMessage(SUCCESS, { id: 'investibleAddSucceeded' });
    dispatch(fetchUser({ marketId: params.marketId }));
  }).catch((error) => {
    console.error(error);
    sendIntlMessage(ERROR, { id: 'investibleBindFailed' });
  });
};

export const createMarketInvestible = (params = {}) => (dispatch) => {
  const clientPromise = getClient();
  return clientPromise.then(client => client.investibles.create(params.title, params.description))
    .then((investible) => {
      dispatch(investibleCreated(investible));
      // inform the invest they need to fetch the new market investible
      const payload = {
        marketId: params.marketId,
        teamId: params.teamId,
        investibleId: investible.id,
        quantity: 1,
        categoryList: [params.category],
        canInvest: params.canInvest,
      };
      dispatch(createNewBoundInvestible(payload));
    }).catch((error) => {
      console.log(error);
      sendIntlMessage(ERROR, { id: 'investibleAddFailed' });
      dispatch(investibleCreated([]));
    });
};

export const deleteMarketInvestible = (params = {}) => (dispatch) => {
  const { marketId, investibleId } = params;
  const clientPromise = getClient();
  return clientPromise.then(client => client.investibles.delete(investibleId))
    .then((deleted) => {
      dispatch(investibleDeleted(marketId, investibleId));
      sendIntlMessage(SUCCESS, { id: 'marketInvestibleDeleted' });
    }).catch((error) => {
      console.log(error);
      sendIntlMessage(ERROR, { id: 'marketInvestibleDeleteFailed' });
    });
};
