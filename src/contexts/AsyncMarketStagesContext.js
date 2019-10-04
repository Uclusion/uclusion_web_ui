import React, { useState } from 'react';
import { createCachedAsyncContext } from './CachedAsyncContextCreator';
import { getMarketStages } from '../api/markets';

const emptyState = {
  stagesList: {},
};

const contextPackage = createCachedAsyncContext('async_market_stages', emptyState);

const {
  context, addStateCache, setStateValues, loadingWrapper, getState,
} = contextPackage;

function refreshStages(marketId) {
  const refreshMarketStages = () => getState()
    .then((state) => {
      const { stagesList } = state;
      return getMarketStages(marketId)
        .then((marketStages) => {
          const newStages = { ...stagesList, [marketId]: marketStages };
          return setStateValues({ stagesList: newStages });
        });
    });
  return loadingWrapper(refreshMarketStages);
}

const AsyncMarketStagesContext = context;

function AsyncMarketStagesProvider(props) {
  const [state, setState] = useState(emptyState);
  console.log('Replacing market stages state cache');
  addStateCache(state, setState);
  // the provider value needs the new state cache object in order to alert
  // provider descendants to changes
  const providerState = { ...contextPackage, stateCache: state, refreshStages };

  return (
    <AsyncMarketStagesContext.Provider value={providerState}>
      {props.children}
    </AsyncMarketStagesContext.Provider>
  );
}

export { AsyncMarketStagesProvider, AsyncMarketStagesContext };
