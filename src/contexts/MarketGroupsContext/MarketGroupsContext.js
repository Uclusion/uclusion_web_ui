import React, { useCallback, useEffect, useReducer } from 'react'
import reducer, { initializeState } from './marketGroupsContextReducer'
import LocalForageHelper from '../../utils/LocalForageHelper'
import { APPLICATION_CACHE_NAMESPACES } from '../../utils/applicationCacheRecovery';
import beginListening from './marketGroupsContextMessages'
import { flushSync } from 'react-dom';

const MARKET_GROUPS_CONTEXT_NAMESPACE = APPLICATION_CACHE_NAMESPACES.GROUPS;
const EMPTY_STATE = { initializing: true };

const MarketGroupsContext = React.createContext(EMPTY_STATE);

let marketGroupsContextHack;
export { marketGroupsContextHack };

function MarketGroupsProvider (props) {
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);

  const hydrateMarketGroupsFromDisk = useCallback(() => {
    const lfg = new LocalForageHelper(MARKET_GROUPS_CONTEXT_NAMESPACE);
    return lfg.getStoredState().then((diskState) => {
      const hydratedState = diskState || {};
      flushSync(() => dispatch(initializeState(hydratedState, diskState == null)));
      return hydratedState;
    });
  }, []);

  useEffect(() => {
    // set the new state cache to something we control, so that our
    // provider descendants will pick up changes to it
    // load state from storage
    hydrateMarketGroupsFromDisk()
      .catch((error) => console.warn('Unable to load groups from disk', error));
    beginListening(dispatch);
    return () => {};
  }, [hydrateMarketGroupsFromDisk]);
  marketGroupsContextHack = state;
  return (
    <MarketGroupsContext.Provider value={[state, dispatch, hydrateMarketGroupsFromDisk]}>
      {props.children}
    </MarketGroupsContext.Provider>
  );
}

export { MarketGroupsProvider, MarketGroupsContext, EMPTY_STATE, MARKET_GROUPS_CONTEXT_NAMESPACE };
