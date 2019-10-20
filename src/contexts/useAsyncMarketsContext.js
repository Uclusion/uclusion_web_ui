import { useContext } from 'react';
import _ from 'lodash';
import { AsyncMarketsContext } from './AsyncMarketContext';

function useAsyncMarketsContext() {
  const { getState, setStateValues, stateCache } = useContext(AsyncMarketsContext);

  function switchMarket(marketId) {
    return getState()
      .then((state) => {
        const { markets } = state;
        if (!_.isEmpty(markets)) {
          const found = markets.find((market) => market.id === marketId);
          return setStateValues({ currentMarket: found });
        }
        return Promise.resolve(null);
      });
  }

  function getCurrentMarket() {
    return getState()
      .then((state) => state.currentMarket);
  }

  function getCurrentUser() {
    return getState()
      .then((state) => {
        const { marketDetails, currentMarket } = state;
        const { id: marketId } = currentMarket;
        const currentMarketDetails = marketDetails.find((item) => item.id === marketId);
        const { currentUser } = currentMarketDetails;
        return currentUser;
      });
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
    const { id } = market;
    return getState()
      .then((state) => {
        const { marketDetails: oldDetails, markets: oldMarkets } = state;
        // update the name in the market list, or add if new
        const oldListItem = oldMarkets.find((item) => item.id === id);
        const newMarkets = (oldListItem)
          ? _.unionBy([{ ...oldListItem, name: market.name }], oldMarkets, 'id')
          : [...oldMarkets, market];
        // there's no token in the market above, and extra stuff, but name, etc lines up
        // it'll also be replaced at the next refresh
        const newDetails = _.unionBy([market], oldDetails, 'id');
        // lastly update the current market to the new data, or if it's not set, leave it alone
        const { currentMarket } = state;
        const newCurrentMarket = (!currentMarket) ? currentMarket
          : newMarkets.find((item) => item.id === currentMarket.id);

        return setStateValues({
          markets: newMarkets,
          marketDetails: newDetails,
          currentMarket: newCurrentMarket,
        });
      });
  }

  function addMarketLocally(market) {
    return updateMarketLocally(market);
  }

  console.debug('Use market context being rerendered');

  return {
    getCurrentMarket,
    getCurrentUser,
    getMarketDetails,
    getMarkets,
    switchMarket,
    updateMarketLocally,
    addMarketLocally,
    ...stateCache,
  };
}

export default useAsyncMarketsContext;
