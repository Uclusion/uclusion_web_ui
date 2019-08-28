import React, { useEffect } from 'react';
import useMarketContext from '../../contexts/useMarketsContext';
import MarketsList from './MarketsList';
import _ from 'lodash';

const pollRate = 25000; // 5 mins = 300 seconds * 1000 for millis

function Markets(props) {

  const { marketDetails, activeMarkets, refreshMarkets } = useMarketContext();

  useEffect(() => {
    // this if conditional is crap. Fix it with something better
    if (!marketDetails || (_.isEmpty(marketDetails) && !_.isEmpty(activeMarkets))){
      refreshMarkets();
    }
    const timer = setInterval(() => refreshMarkets(), pollRate);
    return () => {
      clearInterval(timer);
    };
  });
  console.log('Rendering market details');
  console.log(marketDetails);
  return (
    <MarketsList markets={marketDetails} />
  );
}
export default Markets;