import React, { useEffect, useState, useReducer } from 'react';
import reducer, { initializeState } from './commentsContextReducer';
import LocalForageHelper from '../LocalForageHelper';
import beginListening from './commentsContextMessages';

const COMMENTS_CONTEXT_NAMESPACE = 'comments_context';
const EMPTY_STATE = {};

const CommentsContext = React.createContext(EMPTY_STATE);

function CommentsProvider(props) {
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);
  const [isInitialization, setIsInitialization] = useState(true);
  useEffect(() => {
    if (isInitialization) {
      // set the new state cache to something we control, so that our
      // provider descendants will pick up changes to it
      // load state from storage
      const lfg = new LocalForageHelper(COMMENTS_CONTEXT_NAMESPACE);
      lfg.getState()
        .then((state) => {
          // // console.debug(`Found comments ${state}`);
          // // console.debug(state);
          if (state) {
            dispatch(initializeState(state));
          }
        });
      beginListening(dispatch);
      setIsInitialization(false);
    }
    return () => {};
  }, [isInitialization, state]);

  return (
    <CommentsContext.Provider value={[state, dispatch]} >
      {props.children}
    </CommentsContext.Provider>
  );
}

export { CommentsProvider, CommentsContext, EMPTY_STATE, COMMENTS_CONTEXT_NAMESPACE };
