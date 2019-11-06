import React, { useEffect, useReducer, useState } from 'react';
import beginListening from './marketsContextMessages';
import reducer, { initializeState } from './marketsContextReducer';
import LocalForageHelper from '../LocalForageHelper';
import { getUclusionLocalStorageItem, setUclusionLocalStorageItem } from '../../components/utils';

const MARKET_CONTEXT_NAMESPACE = 'market_context';
const EMPTY_STATE = {
  marketDetails: [],
  markets: [],
};

const MarketsContext = React.createContext(EMPTY_STATE);

function MarketsProvider(props) {
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);
  const [isInitialization, setIsInitialization] = useState(true);
  // we dump our local data frequently. In that case we'll also want to re-initialize
  // it's most important to do it here, since this context
  // reloads it's data from api after loading from disk
  const haveLocalData = getUclusionLocalStorageItem(MARKET_CONTEXT_NAMESPACE);
  useEffect(() => {
    if (isInitialization || !haveLocalData) {
      // load state from storage
      const lfg = new LocalForageHelper(MARKET_CONTEXT_NAMESPACE);
      lfg.getState()
        .then((diskState) => {
          if (diskState) {
            dispatch(initializeState(diskState));
          }
        });
      beginListening(dispatch);
      setIsInitialization(false);
      setUclusionLocalStorageItem(MARKET_CONTEXT_NAMESPACE, true);
    }
    return () => {
    };
  }, [isInitialization, state, haveLocalData]);


  console.debug('Market context being rerendered');

  return (
    <MarketsContext.Provider value={[state, dispatch]}>
      {props.children}
    </MarketsContext.Provider>
  );
}

export { MarketsProvider, MarketsContext, MARKET_CONTEXT_NAMESPACE, EMPTY_STATE };
