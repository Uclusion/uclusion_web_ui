import React, { useEffect, useReducer } from 'react'
import reducer, { initializeState } from './diffContextReducer'
import LocalForageHelper from '../../utils/LocalForageHelper'
import { isSignedOut } from '../../utils/userFunctions'
import { clearUclusionLocalStorage } from '../../components/localStorageUtils'

const DIFF_CONTEXT_NAMESPACE = 'diff_context';
const EMPTY_STATE = {initializing: true};

const DiffContext = React.createContext(EMPTY_STATE);

function DiffProvider(props) {
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);

  useEffect(() => {
    if (!isSignedOut()) {
      // set the new state cache to something we control, so that our
      // provider descendants will pick up changes to it
      // load state from storage
      const lfg = new LocalForageHelper(DIFF_CONTEXT_NAMESPACE);
      lfg.getState()
        .then((state) => {
          // console.debug(`Found diff ${state}`);
          // console.debug(state);
          if (state) {
            dispatch(initializeState(state));
          } else {
            dispatch(initializeState({}));
          }
        });
    } else {
      clearUclusionLocalStorage(false);
    }
    return () => {};
  }, []);

  return (
    <DiffContext.Provider value={[state, dispatch]} >
      {props.children}
    </DiffContext.Provider>
  );
}

export { DiffProvider, DiffContext, EMPTY_STATE, DIFF_CONTEXT_NAMESPACE };
