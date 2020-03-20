import React, { useContext, useEffect, useReducer, useState } from 'react';
import beginListening from './marketsContextMessages';
import reducer, { initializeState } from './marketsContextReducer';
import LocalForageHelper from '../LocalForageHelper';
import { DiffContext } from '../DiffContext/DiffContext';

const MARKET_CONTEXT_NAMESPACE = 'market_context';
const EMPTY_STATE = {
  marketDetails: [],
};

const MarketsContext = React.createContext(EMPTY_STATE);

function MarketsProvider(props) {
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);
  const [, diffDispatch] = useContext(DiffContext);
  const [isInitialization, setIsInitialization] = useState(true);
  useEffect(() => {
    if (isInitialization) {
      // load state from storage
      const lfg = new LocalForageHelper(MARKET_CONTEXT_NAMESPACE);
      lfg.getState()
        .then((diskState) => {
          if (diskState) {
            dispatch(initializeState(diskState));
          }
        });
      beginListening(dispatch, diffDispatch);
      setIsInitialization(false);
    }
    return () => {
    };
  }, [isInitialization, state, diffDispatch]);


  // console.debug('Market context being rerendered');

  return (
    <MarketsContext.Provider value={[state, dispatch]}>
      {props.children}
    </MarketsContext.Provider>
  );
}

export { MarketsProvider, MarketsContext, MARKET_CONTEXT_NAMESPACE, EMPTY_STATE };
