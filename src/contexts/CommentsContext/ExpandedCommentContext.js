import React, { useEffect, useReducer } from 'react'
import LocalForageHelper from '../../utils/LocalForageHelper'
import beginListening from './expandedCommentContextMessages'

const ExpandedCommentContext = React.createContext({});
const THREAD_CONTEXT_NAMESPACE = 'thread_context';
export const EXPANDED_CONTROL = 'EXPANDED';

const reducer = (state, action) => {
  const { type, commentId, expanded, newState } = action;
  if (type === EXPANDED_CONTROL) {
    const newThreadState = { ...state, [commentId]: { expanded } };
    const lfh = new LocalForageHelper(THREAD_CONTEXT_NAMESPACE);
    lfh.setState(newThreadState);
    return newThreadState;
  }
  return newState;
};

function ExpandedCommentProvider(props) {
  const { children } = props;
  const [state, dispatch] = useReducer(reducer, {});

  useEffect(() => {
    beginListening(dispatch);
    const lfg = new LocalForageHelper(THREAD_CONTEXT_NAMESPACE);
    lfg.getState()
      .then((state) => {
        if (state) {
          dispatch({ type: 'INIT', newState: state });
        }
      });
    return () => {};
  }, []);

  return (
    <ExpandedCommentContext.Provider value={[state, dispatch]}>
      {children}
    </ExpandedCommentContext.Provider>
  );
}

export { ExpandedCommentContext, ExpandedCommentProvider };
