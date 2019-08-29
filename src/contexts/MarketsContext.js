import React, { useState, useEffect } from 'react';
import { Hub } from 'aws-amplify';
import { getMarketList } from '../api/sso';
import { getUclusionLocalStorageItem, setUclusionLocalStorageItem } from '../components/utils';
import { convertDates, getMarketDetails } from '../api/markets';
import _ from 'lodash';

const MarketsContext = React.createContext([{}, () => {}]);
const AUTH_HUB_CHANNEL = 'auth';
const LOCAL_STORAGE_KEY = 'markets_context';

// section for helper functions

function getOutdatedMarketIds(markets, state) {
  const { marketDetails } = state;
  // handle the no markets case
  if (_.isEmpty(marketDetails)) {
    return markets.map(market => market.id);
  }
  const needsUpdate = markets.reduce((accumulated, market) => {
    const { updated_at, id } = market;
    const marketDetail = marketDetails.find((details => details.id === id));
    if (!marketDetail) {
      // we found a new market, so we need to pull it
      accumulated.push(id);
    } else {
      // we have the market, so check if it's up to date
      console.debug(`Market detail updated ${marketDetail.updated_at}`);
      console.debug(`Market list updated ${updated_at}`);
      if (marketDetail.updated_at < updated_at) {
        accumulated.push(id);
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

/**
 * Refreshes the active markets, and also pulls in all the market details for them,
 * if the market details is out of date, and purges those that are no longer present
 * @returns {Q.Promise<any>}
 */

export function refreshMarkets(state, setState) {
  console.debug('Refreshing markets');
  return getMarketList()
    .then((markets) => {
      console.debug(`Active markets ${markets}`);
      const filteredDetails = getFilteredMarketDetails(markets, state.marketDetails);
      console.debug(`Filtered Details ${filteredDetails}`);
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

function MarketsProvider(props) {
  const defaultState = getUclusionLocalStorageItem(LOCAL_STORAGE_KEY) || { markets: [], marketDetails:[] };
  const [state, setState] = useState(defaultState);


  // persist state locally on change
  useEffect(() => {
    setUclusionLocalStorageItem(LOCAL_STORAGE_KEY, state);
  }, [state]);

  Hub.listen(AUTH_HUB_CHANNEL, (data) => {
    const { payload: { event } } = data;
    console.debug(`Markets context responding to auth event ${event}`);

    switch (event) {
      case 'signIn':
        refreshMarkets(state, setState);
        break;
      case 'signOut':
        setState({ ...state, markets: [], currentMarket: null, marketDetails: [] });
        break;
      default:
        console.debug(`Ignoring auth event ${event}`);
    }
  });

  return (
    <MarketsContext.Provider value={[state, setState]}>
      { props.children }
    </MarketsContext.Provider>
  );
}

export { MarketsContext, MarketsProvider };
