import { getAccountClient, getMarketClient } from './uclusionClient';
import { convertDates } from '../contexts/ContextUtils';

export function getMarketDetails(marketId) {
  return getMarketClient(marketId)
    .then((client) => client.markets.get())
    .then((market) => convertDates(market));
}

export function updateMarket(marketId, name, description) {
  const updateOptions = { name, description };
  console.debug(`Updating market ${marketId}`);
  console.debug(updateOptions);
  return getMarketClient(marketId)
    .then((client) => client.markets.updateMarket(updateOptions));
}

export function createMarket(accountId, name, description, expirationMinutes) {
  const addPackage = { name, description, expiration_minutes: expirationMinutes };
  return getAccountClient(accountId)
    .then((client) => client.markets.createMarket(addPackage));
}
