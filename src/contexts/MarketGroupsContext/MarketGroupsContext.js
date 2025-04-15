import React, { useEffect, useReducer } from 'react'
import reducer, { initializeState } from './marketGroupsContextReducer'
import LocalForageHelper from '../../utils/LocalForageHelper'
import beginListening from './marketGroupsContextMessages'

const MARKET_GROUPS_CONTEXT_NAMESPACE = 'market_groups';
const GROUPS_CHANNEL = 'groups';
const EMPTY_STATE = { initializing: true };

const MarketGroupsContext = React.createContext(EMPTY_STATE);

let marketGroupsContextHack;
export { marketGroupsContextHack };

function MarketGroupsProvider (props) {
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);

  useEffect(() => {
    // set the new state cache to something we control, so that our
    // provider descendants will pick up changes to it
    // load state from storage
    const lfg = new LocalForageHelper(MARKET_GROUPS_CONTEXT_NAMESPACE);
    lfg.getState()
      .then((state) => {
        if (state) {
          dispatch(initializeState(state));
        } else {
          dispatch(initializeState({}));
        }
      });
    beginListening(dispatch);
    return () => {};
  }, []);
  marketGroupsContextHack = state;
  return (
    <MarketGroupsContext.Provider value={[state, dispatch]}>
      {props.children}
    </MarketGroupsContext.Provider>
  );
}

export { MarketGroupsProvider, MarketGroupsContext, EMPTY_STATE, MARKET_GROUPS_CONTEXT_NAMESPACE, GROUPS_CHANNEL   };

