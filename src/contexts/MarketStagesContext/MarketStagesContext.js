import React, { useCallback, useEffect, useReducer } from 'react'
import reducer, { initializeState } from './marketStagesContextReducer'
import LocalForageHelper from '../../utils/LocalForageHelper'
import beginListening from './marketStagesContextMessages'
import { flushSync } from 'react-dom';

const MARKET_STAGES_CONTEXT_NAMESPACE = 'market_stages';
const STAGES_CHANNEL = 'stages';
const EMPTY_STATE = { initializing: true };

const MarketStagesContext = React.createContext(EMPTY_STATE);

let marketStagesContextHack;
export { marketStagesContextHack };

function MarketStagesProvider (props) {
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);

  const hydrateMarketStagesFromDisk = useCallback(() => {
    const lfg = new LocalForageHelper(MARKET_STAGES_CONTEXT_NAMESPACE);
    return lfg.getStoredState().then((diskState) => {
      const hydratedState = diskState || {};
      flushSync(() => dispatch(initializeState(hydratedState)));
      return hydratedState;
    });
  }, []);

  useEffect(() => {
    // set the new state cache to something we control, so that our
    // provider descendants will pick up changes to it
    // load state from storage
    hydrateMarketStagesFromDisk()
      .catch((error) => console.warn('Unable to load stages from disk', error));
    beginListening(dispatch);
    return () => {};
  }, [hydrateMarketStagesFromDisk]);
  marketStagesContextHack = state;
  return (
    <MarketStagesContext.Provider value={[state, dispatch, hydrateMarketStagesFromDisk]}>
      {props.children}
    </MarketStagesContext.Provider>
  );
}

export { MarketStagesProvider, MarketStagesContext, EMPTY_STATE, MARKET_STAGES_CONTEXT_NAMESPACE, STAGES_CHANNEL };
