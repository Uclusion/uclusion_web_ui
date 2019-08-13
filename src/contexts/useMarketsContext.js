import { useContext } from 'react';
import { MarketsContext } from './MarketsContext';


function useMarketsContext() {
  const [state, setState] = useContext(MarketsContext);

  function switchMarket(marketId) {
    const { markets } = state;
    const found = markets.find(market => market.id === marketId);
    setState({ ...state, currentMarket: found });
  }

  function setMarkets(markets) {
    setState({ ...state, markets });
  }

  return {
    currentMarket: state.currentMarket,
    markets: state.markets,
    setMarkets,
    switchMarket,
  };

}

export default useMarketsContext;
