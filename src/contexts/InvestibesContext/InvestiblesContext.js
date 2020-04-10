import React, { useEffect, useState, useReducer, useContext } from 'react';
import reducer, { initializeState } from './investiblesContextReducer';
import LocalForageHelper from '../../utils/LocalForageHelper';
import beginListening from './investiblesContextMessages';
import { DiffContext } from '../DiffContext/DiffContext';
import { pushMessage } from '../../utils/MessageBusUtils';
import {
  INDEX_INVESTIBLE_TYPE,
  INDEX_UPDATE,
  SEARCH_INDEX_CHANNEL
} from '../SearchIndexContext/searchIndexContextMessages';

const INVESTIBLES_CONTEXT_NAMESPACE = 'investibles';
const EMPTY_STATE = {initializing: true};

const InvestiblesContext = React.createContext(EMPTY_STATE);

function InvestiblesProvider(props) {
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);
  const [, diffDispatch] = useContext(DiffContext);
  const [isInitialization, setIsInitialization] = useState(true);

  useEffect(() => {
    if (isInitialization) {
      // load state from storage
      const lfg = new LocalForageHelper(INVESTIBLES_CONTEXT_NAMESPACE);
      lfg.getState()
        .then((state) => {
          if (state) {
            const indexItems = Object.values(state).map((item) => item.investible);
            const indexMessage = {event: INDEX_UPDATE, itemType: INDEX_INVESTIBLE_TYPE, items: indexItems};
            pushMessage(SEARCH_INDEX_CHANNEL, indexMessage);
            dispatch(initializeState(state));
          }
        });
      beginListening(dispatch, diffDispatch);
      setIsInitialization(false);
    }
    return () => {
    };
  }, [isInitialization, diffDispatch]);

  // console.debug('Investibles context being rerendered');

  return (
    <InvestiblesContext.Provider value={[state, dispatch]}>
      {props.children}
    </InvestiblesContext.Provider>
  );
}

export { InvestiblesProvider, InvestiblesContext, EMPTY_STATE, INVESTIBLES_CONTEXT_NAMESPACE };
