import React, { useEffect, useReducer } from 'react'
import beginListening from './highligtedCommentContextMessages'

const HighlightedCommentContext = React.createContext({});
const HIGHLIGHT_DELAY = 300000;
export const HIGHLIGHT_ADD = 'ADD';
export const HIGHLIGHT_REMOVE = 'REMOVE';
export const EXPANDED = 'EXPANDED';

function HighlightedCommentProvider(props) {
  const { children } = props;
  const [state, dispatch] = useReducer((state, action) => {
    const { type, commentId, level, newState } = action;
    if (type === HIGHLIGHT_ADD) {
      setTimeout(() => {
        dispatch({ type: HIGHLIGHT_REMOVE, commentId });
      }, HIGHLIGHT_DELAY);
      return { ...state, [commentId]: { level } };
    }
    if (type === HIGHLIGHT_REMOVE) {
      return { ...state, [commentId]: { } };
    }
    return {...state, ...newState};
  }, {});

  useEffect(() => {
    beginListening(dispatch);
    return () => {};
  }, []);

  return (
    <HighlightedCommentContext.Provider value={[state, dispatch]}>
      {children}
    </HighlightedCommentContext.Provider>
  );
}

export { HighlightedCommentContext, HighlightedCommentProvider };
