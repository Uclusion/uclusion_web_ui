import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import { Hub } from 'aws-amplify';
import { createCachedAsyncContext } from './CachedAsyncContextCreator';
import { getMarketList } from '../api/sso';
import { getMarketDetails } from '../api/markets';
import { getOutdatedObjectIds, removeDeletedObjects, convertDates } from './ContextUtils';
import {
  AUTH_HUB_CHANNEL, MESSAGES_EVENT, IDENTITY_EVENT, PUSH_CONTEXT_CHANNEL,
} from './WebSocketContext';

const STATE_NAMESPACE = 'async_markets';

const emptyState = {
  marketDetails: [],
  markets: [],
};

const contextPackage = createCachedAsyncContext(STATE_NAMESPACE, emptyState);

const {
  context,
  getState,
  addStateCache,
  clearState,
  setStateValues,
  loadingWrapper,
} = contextPackage;

/**
 * Refreshes the markets. This and refresh markets are here instead of the
 * use context because we need it in the HUB listening components
 * @returns {Promise<any | never | never>}
 */
const marketRefresher = () => {
  console.debug('Refreshing markets');
  return getState()
    .then((state) => getMarketList()
      .then((markets) => {
        // console.debug(`Active markets ${markets}`);
        const filteredDetails = removeDeletedObjects(markets, state.marketDetails);
        // console.debug(`Filtered Details ${filteredDetails}`);
        const outdated = getOutdatedObjectIds(markets, state.markets);
        console.debug(`Outdated markets ${outdated}`);
        const promises = outdated.map((marketId) => getMarketDetails(marketId));
        return setStateValues({ markets })
          .then(() => Promise.all(promises)
            .then((markets) => {
              //  console.debug('Got new details');
              const dateConverted = markets.map((market) => convertDates(market));
              const newDetails = _.unionBy(dateConverted, filteredDetails, 'id');
              console.log(newDetails);
              return setStateValues({ marketDetails: newDetails });
            }));
      }));
};


function refreshMarkets() {
  return loadingWrapper(marketRefresher);
}

const AsyncMarketsContext = context;

function AsyncMarketsProvider(props) {
  const [myState, setMyState] = useState(emptyState);
  const [isInitialization, setIsInitialization] = useState(true);
  useEffect(() => {
    if (isInitialization) {
      setIsInitialization(false);
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
      Hub.listen(PUSH_CONTEXT_CHANNEL, (data) => {
        const { payload: { event, message } } = data;
        switch (event) {
          case IDENTITY_EVENT: {
            const { indirect_object_id: foundMarketId } = message;
            getState().then((state) => {
              const { markets } = state;
              let existing;
              if (markets) {
                existing = markets.find((market) => market.id === foundMarketId);
              }
              if (!existing) {
                console.debug(`Markets context responding to identity event ${event}`);
                // Only want to get token and details if this is the user just added
                refreshMarkets();
              }
            });
            break;
          }
          case MESSAGES_EVENT: {
            console.debug(`Markets context responding to updated market event ${event}`);
            const { object_id: foundMarketId } = message;
            const loadingFunc = () => getState()
              .then((state) => getMarketDetails(foundMarketId).then((market) => {
                const convertedMarket = convertDates(market);
                const newDetails = _.unionBy([convertedMarket], state.marketDetails, 'id');
                return setStateValues({ marketDetails: newDetails });
              }));
            loadingWrapper(loadingFunc);
            break;
          }
          default:
            console.debug(`Ignoring identity event ${event}`);
        }
      });
      refreshMarkets();
    }
    return () => {
    };
  }, [isInitialization, myState]);

  // we've updated the context's internal state cache variable via addState above,
  // however the variable in providerState is the default which isn't any good
  // hence we need to use myState as the stateCache that we give the provider
  const providerState = { ...contextPackage, stateCache: myState };
  return (
    <AsyncMarketsContext.Provider value={providerState}>
      {props.children}
    </AsyncMarketsContext.Provider>
  );
}

export { AsyncMarketsProvider, AsyncMarketsContext };
