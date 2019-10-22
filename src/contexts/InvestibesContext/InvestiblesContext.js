import React, { useEffect, useState, useReducer } from 'react';
import reducer, { initializeState } from './investiblesContextReducer';
import LocalForageHelper from '../LocalForageHelper';
import beginListening from './investiblesContextMessages';

const INVESTIBLES_CONTEXT_NAMESPACE = 'investibles';
const EMPTY_STATE = {};

const InvestiblesContext = React.createContext(EMPTY_STATE);

function InvestiblesProvider(props) {
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);
  const [isInitialization, setIsInitialization] = useState(true);

  useEffect(() => {
    if (isInitialization) {
      // load state from storage
      const lfg = new LocalForageHelper(INVESTIBLES_CONTEXT_NAMESPACE);
      lfg.getState()
        .then((state) => {
          if (state) {
            dispatch(initializeState(state));
          }
        });
      beginListening(dispatch);
      setIsInitialization(false);
    }
    return () => {
    };
  }, [isInitialization, state]);

  console.debug('Investibles context being rerendered');

  return (
    <InvestiblesContext.Provider value={[state, dispatch]}>
      {props.children}
    </InvestiblesContext.Provider>
  );
}

export { InvestiblesProvider, InvestiblesContext, EMPTY_STATE, INVESTIBLES_CONTEXT_NAMESPACE };
