import React, { useCallback, useEffect, useReducer } from 'react'
import reducer, { hydrateState, initializeState } from './diffContextReducer'
import LocalForageHelper from '../../utils/LocalForageHelper'
import { flushSync } from 'react-dom';

const DIFF_CONTEXT_NAMESPACE = 'diff_context';
const EMPTY_STATE = {initializing: true};

const DiffContext = React.createContext(EMPTY_STATE);

function DiffProvider(props) {
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);

  const readStateFromDisk = useCallback((actionCreator) => {
    const lfg = new LocalForageHelper(DIFF_CONTEXT_NAMESPACE);
    return lfg.getStoredState().then((diskState) => {
      const hydratedState = diskState || {};
      flushSync(() => dispatch(actionCreator(hydratedState)));
      return hydratedState;
    });
  }, []);

  const hydrateDiffFromDisk = useCallback(() => readStateFromDisk(hydrateState), [readStateFromDisk]);

  useEffect(() => {
    // set the new state cache to something we control, so that our
    // provider descendants will pick up changes to it
    // load state from storage
    readStateFromDisk(initializeState)
      .catch((error) => console.warn('Unable to load diff from disk', error));
    return () => {};
  }, [readStateFromDisk]);

  return (
    <DiffContext.Provider value={[state, dispatch, hydrateDiffFromDisk]} >
      {props.children}
    </DiffContext.Provider>
  );
}

export { DiffProvider, DiffContext, EMPTY_STATE, DIFF_CONTEXT_NAMESPACE };
