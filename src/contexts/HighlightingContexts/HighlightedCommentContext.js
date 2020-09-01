import React, { useEffect, useReducer } from 'react'
import beginListening from './highligtedCommentContextMessages'
import _ from 'lodash'

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
      const newState = _.pickBy(state, (value, key) => key !== commentId);
      return { ...newState };
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
