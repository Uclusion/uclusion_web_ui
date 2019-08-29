import { useContext } from 'react';
import _ from 'lodash';
import { MarketsContext } from './MarketsContext';
import { refreshMarkets } from './MarketsContext';


function useMarketsContext() {
  const [state, setState] = useContext(MarketsContext);

  function switchMarket(marketId) {
    const { activeMarkets } = state;
    const found = activeMarkets.find(market => market.id === marketId);
    setState({ ...state, currentMarket: found });
  }

  function setActiveMarkets(activeMarkets) {
    setState({ ...state, activeMarkets });
  }

  function boundRefreshMarkets() {
    return refreshMarkets(state, setState);
  }


  return {
    currentMarket: state.currentMarket,
    activeMarkets: state.activeMarkets,
    marketDetails: state.marketDetails,
    setActiveMarkets,
    refreshMarkets: boundRefreshMarkets,
    switchMarket,
  };

}

export default useMarketsContext;
