import { getMarketClient } from './uclusionClient';

export function convertDates(market) {
  const { created_at, updated_at } = market;
  const newMarket = {
    ...market,
    created_at: new Date(created_at),
    updated_at: new Date(updated_at),
  };
  return newMarket;
}

export function getMarketDetails(marketId) {
  return getMarketClient(marketId)
    .then(client => client.markets.get())
    .then((market) => {
      return convertDates(market);
    });
}