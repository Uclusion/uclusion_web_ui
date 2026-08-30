import React, { useCallback, useEffect, useReducer } from 'react'
import beginListening from './marketPresencesMessages'
import reducer, { initializeState } from './marketPresencesContextReducer'
import LocalForageHelper from '../../utils/LocalForageHelper'
import { flushSync } from 'react-dom';

const PRESENCE_CHANNEL = 'presence';
const MARKET_PRESENCES_CONTEXT_NAMESPACE = 'market_presences';
const EMPTY_STATE = {initializing: true};
const MarketPresencesContext = React.createContext(EMPTY_STATE);

// Mentions require presences, and we are caching Quill Editors so safest to hack as with others
let marketPresencesContextHack;
export { marketPresencesContextHack };

function MarketPresencesProvider(props) {
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);

  const hydrateMarketPresencesFromDisk = useCallback(() => {
    const lfh = new LocalForageHelper(MARKET_PRESENCES_CONTEXT_NAMESPACE);
    return lfh.getStoredState().then((diskState) => {
      const hydratedState = diskState || {};
      flushSync(() => dispatch(initializeState(hydratedState)));
      return hydratedState;
    });
  }, []);

  useEffect(() => {
    hydrateMarketPresencesFromDisk()
      .catch((error) => console.warn('Unable to load presences from disk', error));
    beginListening(dispatch);
    return () => {};
  }, [hydrateMarketPresencesFromDisk]);

  marketPresencesContextHack = state;
  return (
    <MarketPresencesContext.Provider value={[state, dispatch, hydrateMarketPresencesFromDisk]}>
      {props.children}
    </MarketPresencesContext.Provider>
  );
}

export { MarketPresencesProvider, MarketPresencesContext, EMPTY_STATE, MARKET_PRESENCES_CONTEXT_NAMESPACE,
  PRESENCE_CHANNEL };
