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
  const updateOptions = { name, description };
  console.debug(`Updating market ${marketId}`);
  console.debug(updateOptions);
  return getMarketClient(marketId)
    .then(client => client.markets.updateMarket(updateOptions));
}
