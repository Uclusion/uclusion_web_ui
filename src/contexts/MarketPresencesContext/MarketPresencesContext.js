import React, { useEffect, useReducer, useState } from 'react';
import beginListening from './marketPresencesMessages';
import reducer, { initializeState } from './marketPresencesContextReducer';
import LocalForageHelper from '../../utils/LocalForageHelper';

const MARKET_PRESENCES_CONTEXT_NAMESPACE = 'market_presences';
const EMPTY_STATE = {initializing: true};
const MarketPresencesContext = React.createContext(EMPTY_STATE);

function MarketPresencesProvider(props) {
  // console.debug('Context market presences being rerendered');
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);
  const [isInitialization, setIsInitialization] = useState(true);

  useEffect(() => {
    if (isInitialization) {
      const lfh = new LocalForageHelper(MARKET_PRESENCES_CONTEXT_NAMESPACE);
      lfh.getState()
        .then((diskState) => {
          if (diskState) {
            dispatch(initializeState(diskState));
          }
        });
      beginListening(dispatch);
      setIsInitialization(false);
    }
    return () => {
    };
  }, [isInitialization, state]);

  return (
    <MarketPresencesContext.Provider value={[state, dispatch]}>
      {props.children}
    </MarketPresencesContext.Provider>
  );
}

export { MarketPresencesProvider, MarketPresencesContext, EMPTY_STATE, MARKET_PRESENCES_CONTEXT_NAMESPACE };
