import { useContext } from 'react';
import _ from 'lodash';
import { MarketsContext } from './MarketsContext';
import { getMarketList } from '../api/sso';
import { convertDates, getMarketDetails } from '../api/markets';

// section for helper functions

function getOutdatedMarketIds(markets, state) {
  const { marketDetails } = state;
  // handle the no markets case
  if (_.isEmpty(marketDetails)) {
    return markets.map(market => market.id);
  }
  const needsUpdate = markets.reduce((accumulated, market) => {
    const { updated_at } = market;
    const marketDetail = marketDetails.find((details => details.id === market.id));
    if (!marketDetail) {
      // we found a new market, so we need to pull it
      accumulated.push(market.id);
    } else {
      // we have the market, so check if it's up to date
      console.debug(`Market detail updated ${marketDetail.updated_at}`);
      console.debug(`Market list updated ${updated_at}`);
      if (marketDetail.updated_at < updated_at) {
        accumulated.push(marketDetail.id);
      }
    }
    return accumulated;
  }, []);
  return needsUpdate;
}

function getFilteredMarketDetails(markets, oldDetails) {

  if (_.isEmpty(oldDetails)) {
    return oldDetails; // nothing to do
  }
  const newDetails = oldDetails.filter((detail) => {
    const found = markets.find(market => market.id === detail.id);
    return found;
  });
  return newDetails;
}

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

  /**
   * Refreshes the active markets, and also pulls in all the market details for them,
   * if the market details is out of date, and purges those that are no longer present
   * @returns {Q.Promise<any>}
   */

  function refreshMarkets() {
    console.debug('Refreshing markets');
    return getMarketList()
      .then((markets) => {
        const filteredDetails = getFilteredMarketDetails(markets, state.marketDetails);
        console.debug(`Active markets ${markets}`);
        const outdated = getOutdatedMarketIds(markets, filteredDetails);
        console.debug(`Outdated markets ${outdated}`);
        const promises = outdated.map(marketId => getMarketDetails(marketId));
        return Promise.all(promises)
          .then((markets) => {
            console.debug('Got new details');
            const dateConverted = markets.map(market => convertDates(market));
            const newDetails = _.unionBy(dateConverted, filteredDetails, 'id');
            console.log(newDetails);
            setState({ ...state, marketDetails: newDetails });
          });
      });
  }

  return {
    currentMarket: state.currentMarket,
    activeMarkets: state.activeMarkets,
    marketDetails: state.marketDetails,
    setActiveMarkets,
    refreshMarkets,
    switchMarket,
  };

}

export default useMarketsContext;
