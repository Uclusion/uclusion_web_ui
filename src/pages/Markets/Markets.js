import React, { useEffect, useState } from 'react';
import useAsyncMarketContext from '../../contexts/useAsyncMarketsContext';
import MarketsList from './MarketsList';

const pollRate = 3600000; // 60 mins = 3600 seconds * 1000 for millis

function Markets(props) {

  const { refreshMarkets, marketDetails } = useAsyncMarketContext();
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