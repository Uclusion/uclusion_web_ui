import React, { useEffect, useState } from 'react';
import { Hub } from '@aws-amplify/core';
import _ from 'lodash';
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

function getCurrentUserInvestment(investibleId, marketId, investingUser) {
  return getState().then((state) => {
    if (investingUser) {
      const { usersPresenceList } = state;
      const { id } = investingUser;
      const marketUsers = usersPresenceList[marketId];
      if (marketUsers) {
        const userPresence = marketUsers.find((marketUser) => marketUser.id === id);
        if (userPresence) {
          const { investments } = userPresence;
          // eslint-disable-next-line max-len
          const investibleInvestment = investments.find((investment) => investment.investible_id === investibleId);
          if (investibleInvestment) {
            const { quantity } = investibleInvestment;
            console.debug(`Rerendered quantity is ${quantity}`);
            return quantity;
          }
        }
      }
    }
    console.debug('Quantity undefined');
    return undefined;
  });
}

const AsyncMarketPresencesContext = context;

function AsyncMarketPresencesProvider(props) {
  console.debug('Context market presences being rerendered');
  const [state, setState] = useState(emptyState);
  const [isInitialization, setIsInitialization] = useState(true);

  useEffect(() => {
    if (isInitialization) {
      console.log('Rerendered market presences state cache');
      addStateCache(state, setState);
      Hub.listen(PUSH_PRESENCE_CHANNEL, (data) => {
        const { payload: { event, message } } = data;

        switch (event) {
          case MESSAGES_EVENT: {
            const { indirect_object_id: marketId } = message;
            console.debug(`Rerendered for push event ${event}`);
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
  }, [isInitialization, state]);

  contextPackage.stateCache = state;
  const helperContext = {
    refreshMarketPresence,
    getCurrentUserInvestment,
    ...state,
  };
  _.assignIn(contextPackage, helperContext);
  return (
    <AsyncMarketPresencesContext.Provider value={contextPackage}>
      {props.children}
    </AsyncMarketPresencesContext.Provider>
  );
}

export { AsyncMarketPresencesProvider, AsyncMarketPresencesContext };
