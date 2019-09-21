import { getMarketClient } from './uclusionClient';
import { ERROR, sendIntlMessage, SUCCESS } from '../utils/userMessage';

export function fetchInvestibles(idList, marketId) {
  const clientPromise = getMarketClient(marketId);
  // console.debug(idList);
  // console.debug(`Fetching idList ${idList}`);
  return clientPromise.then((client) => client.markets.getMarketInvestibles(idList))
    .catch((error) => {
      console.error(error);
      sendIntlMessage(ERROR, { id: 'investibleFetchFailed' });
    });
}

export function fetchInvestibleList(marketId) {
  const clientPromise = getMarketClient(marketId);
  // console.debug(`Fetching investibles list for: ${marketId}`);
  return clientPromise.then((client) => client.markets.listInvestibles())
    .then((response) => {
      const { investibles } = response;
      return investibles;
    }).catch((error) => {
      console.error(error);
      sendIntlMessage(ERROR, { id: 'investibleListFetchFailed' });
    });
}


export function updateInvestment(marketId, investibleId, newQuantity, currentQuantity) {
  return getMarketClient(marketId)
    .then((client) => client.markets.updateInvestment(investibleId, newQuantity, currentQuantity));
}
