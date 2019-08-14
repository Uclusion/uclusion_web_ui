import { useContext } from 'react';
import { MarketsContext } from './MarketsContext';
import { getActiveMarkeList } from '../api/sso';


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

  function refreshMarkets() {
    return getActiveMarkeList()
      .then((markets) => {
        const newState = { ...state, markets };
        setState(newState);
      });
  }

  return {
    currentMarket: state.currentMarket,
    markets: state.markets,
    setMarkets,
    refreshMarkets,
    switchMarket,
  };

}

export default useMarketsContext;
