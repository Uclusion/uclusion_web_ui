import React, { useEffect } from 'react';
import useMarketContext from '../../contexts/useMarketsContext';
import MarketsList from './MarketsList';
const pollRate = 300000; // 5 mins = 400 seconds * 1000 for millis

function Markets(props) {

  const { markets, refreshMarkets } = useMarketContext();

  useEffect(() => {
    if (!markets) {
      refreshMarkets();
    }
    const timer = setInterval(() => refreshMarkets(), pollRate);
    return () => {
      clearInterval(timer);
    };
  });

  return (
    <MarketsList markets={markets} />
  );
}
export default Markets;