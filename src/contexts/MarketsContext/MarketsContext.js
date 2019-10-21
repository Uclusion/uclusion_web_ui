import React, { useEffect, useReducer, useState } from 'react';
import beginListening from './marketsContextMessages';
import reducer, { initializeState } from './marketsContextReducer';
import LocalForageHelper from '../LocalForageHelper';
import { refreshMarkets } from './marketsContextHelper';

const MARKET_CONTEXT_NAMESPACE = 'market_context';
const MarketsContext = React.createContext();
const EMPTY_STATE = {
  marketDetails: [],
  marketsList: [],
};

function MarketsProvider(props) {
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);
  const [isInitialization, setIsInitialization] = useState(true);
  useEffect(() => {
    if (isInitialization) {
      // load state from storage
      const lfg = new LocalForageHelper();
      lfg.getState()
        .then((state) => {
          if (state) {
            dispatch(initializeState(state));
          }
          return state || EMPTY_STATE;
        }).then((usedState) => {
          return refreshMarkets(usedState, dispatch);
        });
      beginListening(dispatch);
      setIsInitialization(false);

    }
    return () => {
    };
  }, [isInitialization, state]);


  console.debug('Market context being rerendered');

  return (
    <MarketsContext.Provider value={[state, dispatch]}>
      {props.children}
    </MarketsContext.Provider>
  );
}

export { MarketsProvider, MarketsContext, MARKET_CONTEXT_NAMESPACE, EMPTY_STATE };
