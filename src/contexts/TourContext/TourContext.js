import React, { useEffect, useReducer } from 'react';
import {
  clearUclusionLocalStorage,
  getUclusionLocalStorageItem,
  setUclusionLocalStorageItem,
} from '../../components/localStorageUtils'
import { reducer } from './tourContextReducer';
import beginListening from './tourContextMessages'
import { isSignedOut } from '../../utils/userFunctions'

const EMPTY_CONTEXT = {
  steps: [],
  isVisible: false,
};

const TOUR_CONTEXT_KEY = 'tour_context';

const TourContext = React.createContext(EMPTY_CONTEXT);

function TourProvider(props) {
  const { children } = props;
  const defaultValue = getUclusionLocalStorageItem(TOUR_CONTEXT_KEY) || EMPTY_CONTEXT;
  const [state, dispatch] = useReducer(reducer, defaultValue, undefined);

  useEffect(() => {
    if (!isSignedOut()) {
      beginListening(dispatch);
    }
    return () => {};
  }, []);

  useEffect(() => {
    if (!isSignedOut()) {
      setUclusionLocalStorageItem(TOUR_CONTEXT_KEY, state);
    } else {
      console.info('Clearing storage from tour context');
      clearUclusionLocalStorage(false);
    }
  }, [state]);

  return (
    <TourContext.Provider value={[state, dispatch]}>
      {children}
    </TourContext.Provider>
  );
}

export { TourContext, TourProvider };
