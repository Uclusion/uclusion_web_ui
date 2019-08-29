import React, { useEffect, useState } from 'react';
import useMarketContext from '../../contexts/useMarketsContext';
import MarketsList from './MarketsList';

const pollRate = 60000; // 1 mins = 60 seconds * 1000 for millis

function Markets(props) {

  const { marketDetails, refreshMarkets } = useMarketContext();
  const [ firstLoad, setFirstLoad ] = useState(true);

  // refresh on first load of the page, and every pollRate millis thereafter

  useEffect(() => {
    if (firstLoad) {
      refreshMarkets();
      setFirstLoad(false);
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