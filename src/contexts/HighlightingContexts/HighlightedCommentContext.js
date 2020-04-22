import React, { useEffect, useReducer, useState } from 'react'
import LocalForageHelper from '../../utils/LocalForageHelper'
import _ from 'lodash'
import beginListening from './highligtedCommentContextMessages';
const HighlightedCommentContext = React.createContext({});
const THREAD_CONTEXT_NAMESPACE = 'thread_context';
const HIGHLIGHT_DELAY = 300000;
export const HIGHTLIGHT_ADD = 'ADD';
export const HIGHLIGHT_REMOVE = 'REMOVE';
export const EXPANDED = 'EXPANDED';

function HighlightedCommentProvider(props) {
  const { children } = props;
  const [state, dispatch] = useReducer((state, action) => {
    const { type, commentId, level, newRepliesExpanded, newState } = action;
    const oldCommentState = state[commentId] || {};
    if (type === HIGHTLIGHT_ADD) {
      setTimeout(() => {
        dispatch({ type: HIGHLIGHT_REMOVE, commentId });
      }, HIGHLIGHT_DELAY);
      const { repliesExpanded } = oldCommentState;
      return { ...state, [commentId]: { level, repliesExpanded} };
    }
    if (type === HIGHLIGHT_REMOVE) {
      const { repliesExpanded } = oldCommentState;
      return { ...state, [commentId]: { repliesExpanded} };
    }
    if (type === EXPANDED) {
      const { level: oldLevel } = oldCommentState;
      let newThreadState;
      if (!newRepliesExpanded) {
        // Remove high lighting if closing this thread
        newThreadState = { ...state, [commentId]: { repliesExpanded: newRepliesExpanded } };
      } else {
        newThreadState = { ...state, [commentId]: { level: oldLevel, repliesExpanded: newRepliesExpanded } };
      }
      const lfh = new LocalForageHelper(THREAD_CONTEXT_NAMESPACE);
      lfh.setState(newThreadState);
      return newThreadState;
    }
    return newState;
  }, {});

  const [isInitialization, setIsInitialization] = useState(true);
  useEffect(() => {
    if (isInitialization) {
      beginListening(dispatch);
      const lfg = new LocalForageHelper(THREAD_CONTEXT_NAMESPACE);
      lfg.getState()
        .then((state) => {
          if (state) {
            const newState = _.mapValues(state, (value) => {
              const { repliesExpanded } = value;
              // Do not load highlighting from disk
              return { repliesExpanded };
            });
            dispatch({ type: 'INIT', newState });
          }
        });
      setIsInitialization(false);
    }
    return () => {};
  }, [isInitialization, state]);

  return (
    <HighlightedCommentContext.Provider value={[state, dispatch]}>
      {children}
    </HighlightedCommentContext.Provider>
  );
}

export { HighlightedCommentContext, HighlightedCommentProvider };
