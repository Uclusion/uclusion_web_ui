import { getMarketClient } from './uclusionClient';
import { convertDates } from '../contexts/ContextUtils';

export function getMarketDetails(marketId) {
  return getMarketClient(marketId)
    .then(client => client.markets.get())
    .then((market) => {
      return convertDates(market);
    });
}

export function updateMarket(marketId, name, description) {
  return Promise.resolve(true);
}
