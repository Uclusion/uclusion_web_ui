import { getClient } from '../config/uclusionClient';

import { receiveMarket } from '../store/Markets/actions';


export function fetchMarket(dispatch) {
  const clientPromise = getClient();
  return clientPromise.then(client => client.markets.get())
    .then((market) => {
      dispatch(receiveMarket(market));
    }).catch((error) => {
      console.error(error);
    });
}
