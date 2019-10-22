import React, { useState, useReducer } from 'react';
import reducer, { initializeState } from './marketStagesContextReducer';
import LocalForageHelper from '../LocalForageHelper';
const MARKET_STAGES_CONTEXT_NAMESPACE = 'market_stages';
const EMPTY_STATE = {};

const MarketStagesContext = React.createContext(EMPTY_STATE);

function MarketStagesProvider(props) {
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);
  const [isInitialization, setIsInitialization] = useState(true);
  if (isInitialization) {
    // set the new state cache to something we control, so that our
    // provider descendants will pick up changes to it
    console.log('Replacing comments state cache');
    // load state from storage
    const lfg = new LocalForageHelper(MARKET_STAGES_CONTEXT_NAMESPACE);
    lfg.getState()
      .then((state) => {
        if (state) {
          dispatch(initializeState(state));
        }
      });
    setIsInitialization(false);
  }
  console.log('Replacing market stages state cache');
  return (
    <MarketStagesContext.Provider value={[state, dispatch]}>
      {props.children}
    </MarketStagesContext.Provider>
  );
}

export { MarketStagesProvider, MarketStagesContext, EMPTY_STATE, MARKET_STAGES_CONTEXT_NAMESPACE };

