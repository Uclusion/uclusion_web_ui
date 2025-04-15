import React, { useEffect, useReducer } from 'react'
import beginListening from './marketPresencesMessages'
import reducer, { initializeState } from './marketPresencesContextReducer'
import LocalForageHelper from '../../utils/LocalForageHelper'

const PRESENCE_CHANNEL = 'presence';
const MARKET_PRESENCES_CONTEXT_NAMESPACE = 'market_presences';
const EMPTY_STATE = {initializing: true};
const MarketPresencesContext = React.createContext(EMPTY_STATE);

// Mentions require presences, and we are caching Quill Editors so safest to hack as with others
let marketPresencesContextHack;
export { marketPresencesContextHack };

function MarketPresencesProvider(props) {
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);

  useEffect(() => {
    const lfh = new LocalForageHelper(MARKET_PRESENCES_CONTEXT_NAMESPACE);
    lfh.getState()
      .then((diskState) => {
        if (diskState) {
          dispatch(initializeState(diskState));
        } else {
          dispatch(initializeState({}));
        }
      });
    beginListening(dispatch);
    return () => {};
  }, []);

  marketPresencesContextHack = state;
  return (
    <MarketPresencesContext.Provider value={[state, dispatch]}>
      {props.children}
    </MarketPresencesContext.Provider>
  );
}

export { MarketPresencesProvider, MarketPresencesContext, EMPTY_STATE, MARKET_PRESENCES_CONTEXT_NAMESPACE,
  PRESENCE_CHANNEL };
