import { getMarketClient } from './uclusionClient';

import { receiveMarket } from '../store/Markets/actions';


export function fetchMarket(dispatch, marketId) {
  const clientPromise = getMarketClient(marketId);
  return clientPromise.then(client => client.markets.get())
    .then((market) => {
      dispatch(receiveMarket(market));
    }).catch((error) => {
      console.error(error);
    });
}
