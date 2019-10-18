import { getAccountClient, getMarketClient } from './uclusionClient';
import { convertDates } from '../contexts/ContextUtils';

export function getMarketDetails(marketId) {
  return getMarketClient(marketId)
    .then((client) => client.markets.get()
      .then((market) => convertDates(market))
      .then((market) => client.users.get()
        .then((user) => ({
          ...market,
          currentUser: user,
        }))));
}

export function updateMarket(marketId, name, description, uploaded_files) {
  const updateOptions = { name, description, uploaded_files };
  console.debug(`Updating market ${marketId}`);
  console.debug(updateOptions);
  return getMarketClient(marketId)
    .then((client) => client.markets.updateMarket(updateOptions));
}

export function createMarket(name, description, expirationMinutes) {
  const addPackage = { name, description, expiration_minutes: expirationMinutes };
  return getAccountClient()
    .then((client) => client.markets.createMarket(addPackage));
}

export function viewed(marketId, isPresent, investibleId) {
  const viewPromise = getMarketClient(marketId);
  if (investibleId) {
    return viewPromise.then((client) => client.markets.viewedInvestible(investibleId, isPresent));
  }
  return viewPromise.then((client) => client.markets.viewed(isPresent));
}

export function getMarketUsers(marketId) {
  return getMarketClient(marketId)
    .then((client) => client.markets.listUsers());
}

export function getMarketStages(marketId) {
  return getMarketClient(marketId)
    .then((client) => client.markets.listStages());
}
