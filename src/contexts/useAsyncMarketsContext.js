import { useContext } from 'react';
import _ from 'lodash';
import { AsyncMarketsContext } from './AsyncMarketContext';

function useAsyncMarketsContext() {
  const { refreshMarkets, getState, setStateValues, stateCache } = useContext(AsyncMarketsContext);

  function switchMarket(marketId) {
    return getState()
      .then((state) => {
        const { markets } = state;
        if (!_.isEmpty(markets)) {
          const found = markets.find(market => market.id === marketId);
          return setStateValues({ currentMarket: found });
        }
        return Promise.resolve(null);
      });
  }

  function getCurrentMarket() {
    return getState()
      .then((state) => state.currentMarket);
  }

  function getMarketDetails() {
    return getState()
      .then((state) => state.marketDetails);
  }

  function getMarkets() {
    return getState()
      .then((state) => state.markets);
  }

  function updateMarketLocally(market) {
    console.debug(market);
    return Promise.resolve(true);
  }

  return {
    getCurrentMarket,
    getMarketDetails,
    getMarkets,
    refreshMarkets,
    switchMarket,
    updateMarketLocally,
    ...stateCache,
  };

}

export default useAsyncMarketsContext;
