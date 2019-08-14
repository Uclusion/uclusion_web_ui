import { getMarketClient } from './uclusionClient';
import { ERROR, sendIntlMessage, SUCCESS } from '../utils/userMessage';

export function fetchInvestibles(idList, marketId) {
  const clientPromise = getMarketClient(marketId);
  console.log(idList);
  console.debug(`Fetching idList ${idList}`);
  return clientPromise.then(client => client.markets.getMarketInvestibles(idList))
    .catch((error) => {
      console.error(error);
      sendIntlMessage(ERROR, { id: 'investibleFetchFailed' });
    });
}

export function fetchInvestibleList(marketId) {
  const clientPromise = getMarketClient(marketId);
  console.debug(`Fetching investibles list for: ${marketId}`);
  return clientPromise.then(client => client.markets.listInvestibles())
    .then((response) => {
      const { investibles } = response;
      return investibles;
    }).catch((error) => {
      console.error(error);
      sendIntlMessage(ERROR, { id: 'investibleListFetchFailed' });
    });
}

export function updateInvestment (teamId, marketId, investibleId, quantity, currentQuantity, dispatch) {
  const clientPromise = getMarketClient(marketId);
  return clientPromise.then(client => client.markets.updateInvestment(teamId, investibleId, quantity, currentQuantity))
    .then((investment) => {
//      dispatch(investmentUpdated(marketId, investibleId, quantity));
      sendIntlMessage(SUCCESS, { id: 'investmentSucceeded' }, { shares: quantity });
      return Promise.resolve(true);
    }).catch((error) => {
      console.error(error);
      sendIntlMessage(ERROR, { id: 'investmentFailed' });
    });
}

export function deleteInvestible (investibleId, marketId, dispatch) {
  const clientPromise = getMarketClient(marketId);
  return clientPromise.then(client => client.investibles.delete(investibleId))
    .then(() => {
//      dispatch(investibleDeleted(marketId, investibleId));
      sendIntlMessage(SUCCESS, { id: 'marketInvestibleDeleted' });
    }).catch((error) => {
      console.log(error);
      sendIntlMessage(ERROR, { id: 'marketInvestibleDeleteFailed' });
    });
}

