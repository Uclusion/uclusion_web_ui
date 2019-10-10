import React, { useEffect, useState } from 'react';
import { Hub } from '@aws-amplify/core';
import { createCachedAsyncContext } from './CachedAsyncContextCreator';
import { getMarketUsers } from '../api/markets';
import { MESSAGES_EVENT, PUSH_PRESENCE_CHANNEL } from './WebSocketContext';

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
  const [isInitialization, setIsInitialization] = useState(true);
  console.log('Replacing market presences state cache');
  addStateCache(state, setState);
  // the provider value needs the new state cache object in order to alert
  // provider descendants to changes
  const providerState = { ...contextPackage, stateCache: state, refreshMarketPresence };
  useEffect(() => {
    if (isInitialization) {
      Hub.listen(PUSH_PRESENCE_CHANNEL, (data) => {
        const { payload: { event, message } } = data;

        switch (event) {
          case MESSAGES_EVENT: {
            const { indirect_object_id: marketId } = message;
            refreshMarketPresence(marketId);
            break;
          }
          default:
            console.debug(`Ignoring push event ${event}`);
        }
      });
      setIsInitialization(false);
    }
    return () => {
    };
  }, [isInitialization]);

  return (
    <AsyncMarketPresencesContext.Provider value={providerState}>
      {props.children}
    </AsyncMarketPresencesContext.Provider>
  );
}

export { AsyncMarketPresencesProvider, AsyncMarketPresencesContext };
