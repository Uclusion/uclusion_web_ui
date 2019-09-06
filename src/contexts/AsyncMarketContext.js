import React, { useState } from 'react';
import _ from 'lodash';
import { createCachedAsyncContext } from './CachedAsyncContextCreator';
import { Hub } from 'aws-amplify';
import { getMarketList } from '../api/sso';
import { convertDates, getMarketDetails } from '../api/markets';

const STATE_NAMESPACE = 'async_markets';
const AUTH_HUB_CHANNEL = 'auth';

const emptyState = {
  marketDetails: [],
  markets: [],
};

const contextPackage = createCachedAsyncContext(STATE_NAMESPACE, emptyState);

const {
  context,
  getState,
  setState,
  addStateCache,
  clearState,
  setStateValues,
  loadingWrapper,
} = contextPackage;


function getOutdatedMarketIds(markets, marketDetails) {
  // if we don't have market details we're starting from empty, so everything is needed
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
      // console.debug(`Market detail updated ${marketDetail.updated_at}`);
      // console.debug(`Market list updated ${updated_at}`);
      if (marketDetail.updated_at < updated_at) {
        accumulated.push(id);
      }
    }
    return accumulated;
  }, []);
  return needsUpdate;
}

function getAllCurrentMarketDetails(markets, oldDetails) {

  if (_.isEmpty(oldDetails)) {
    return oldDetails; // nothing to do
  }
  const newDetails = oldDetails.filter((detail) => {
    const found = markets.find(market => market.id === detail.id);
    return found;
  });
  return newDetails;
}

const marketRefresher = () => {
  console.debug('Refreshing markets');
  return getState()
    .then((state) => {
      return getMarketList()
        .then((markets) => {
          console.debug(`Active markets ${markets}`);
          const filteredDetails = getAllCurrentMarketDetails(markets, state.marketDetails);
          console.debug(`Filtered Details ${filteredDetails}`);
          const outdated = getOutdatedMarketIds(markets, filteredDetails);
          console.debug(`Outdated markets ${outdated}`);
          const promises = outdated.map(marketId => getMarketDetails(marketId));
          return setStateValues({ markets })
            .then(() => {
              return Promise.all(promises)
                .then((markets) => {
                  console.debug('Got new details');
                  const dateConverted = markets.map(market => convertDates(market));
                  const newDetails = _.unionBy(dateConverted, filteredDetails, 'id');
                  console.log(newDetails);
                  return setState({ ...state, marketDetails: newDetails });
                });
            });
        });
    });
};


function refreshMarkets() {
  return loadingWrapper(marketRefresher);
}


const AsyncMarketsContext = context;
function AsyncMarketsProvider(props) {
  const [myState, setMyState] = useState(emptyState);
  addStateCache(myState, setMyState);

  Hub.listen(AUTH_HUB_CHANNEL, (data) => {
    const { payload: { event } } = data;
    console.debug(`Markets context responding to auth event ${event}`);

    switch (event) {
      case 'signIn':
        refreshMarkets();
        break;
      case 'signOut':
        clearState();
        break;
      default:
        console.debug(`Ignoring auth event ${event}`);
    }
  });
  // we've updated the context's internal state cache variable via addState above,
  // howwever the variable in providerState is the default which isn't any good
  // hence we need to use myState as the stateCache that we give the provider
  const providerState = { ...contextPackage, refreshMarkets, stateCache: myState };
  return (
    <AsyncMarketsContext.Provider value={providerState}>
      {props.children}
    </AsyncMarketsContext.Provider>
  );
}

export { AsyncMarketsProvider, AsyncMarketsContext };