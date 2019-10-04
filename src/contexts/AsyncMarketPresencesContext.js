import React, { useState } from 'react';
import { createCachedAsyncContext } from './CachedAsyncContextCreator';
import { getMarketUsers } from '../api/markets';

const emptyState = {
  usersPresenceList: {},
};

const contextPackage = createCachedAsyncContext('async_market_presences', emptyState);

const {
  context, addStateCache, setStateValues, loadingWrapper, getState,
} = contextPackage;

function refreshMarketPresence(marketId) {
  const refreshMarketUsers = () => getState()
    .then((state) => {
      const { usersPresenceList } = state;
      return getMarketUsers(marketId)
        .then((marketUsers) => {
          const newPresence = { ...usersPresenceList, [marketId]: marketUsers };
          return setStateValues({ usersPresenceList: newPresence });
        });
    });
  return loadingWrapper(refreshMarketUsers);
}

const AsyncMarketPresencesContext = context;

function AsyncMarketPresencesProvider(props) {
  const [state, setState] = useState(emptyState);
  console.log('Replacing market presences state cache');
  addStateCache(state, setState);
  // the provider value needs the new state cache object in order to alert
  // provider descendants to changes
  const providerState = { ...contextPackage, stateCache: state, refreshMarketPresence };

  return (
    <AsyncMarketPresencesContext.Provider value={providerState}>
      {props.children}
    </AsyncMarketPresencesContext.Provider>
  );
}

export { AsyncMarketPresencesProvider, AsyncMarketPresencesContext };
