import React, { useEffect, useReducer } from 'react'
import reducer, { initializeState } from './marketStagesContextReducer'
import LocalForageHelper from '../../utils/LocalForageHelper'
import beginListening from './marketStagesContextMessages'

const MARKET_STAGES_CONTEXT_NAMESPACE = 'market_stages';
const EMPTY_STATE = { initializing: true };

const MarketStagesContext = React.createContext(EMPTY_STATE);

function MarketStagesProvider (props) {
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);

  useEffect(() => {
    // set the new state cache to something we control, so that our
    // provider descendants will pick up changes to it
    // load state from storage
    const lfg = new LocalForageHelper(MARKET_STAGES_CONTEXT_NAMESPACE);
    lfg.getState()
      .then((state) => {
        if (state) {
          dispatch(initializeState(state));
        }
      });
    beginListening(dispatch);
    return () => {};
  }, []);

  return (
    <MarketStagesContext.Provider value={[state, dispatch]}>
      {props.children}
    </MarketStagesContext.Provider>
  );
}

export { MarketStagesProvider, MarketStagesContext, EMPTY_STATE, MARKET_STAGES_CONTEXT_NAMESPACE };

