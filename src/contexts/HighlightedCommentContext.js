import React, { useReducer } from 'react';
import _ from 'lodash';

const HighlightedCommentContext = React.createContext({});
const HIGHLIGHT_DELAY = 300000;
export const HIGHTLIGHT_ADD = 'ADD';
export const HIGHLIGHT_REMOVE = 'REMOVE';

function HighlightedCommentProvider(props) {
  const { children } = props;
  const [state, dispatch] = useReducer((state, action) => {
    const { type, commentId, level } = action;
    if (type === HIGHTLIGHT_ADD) {
      setTimeout(() => {
        dispatch({ type: HIGHLIGHT_REMOVE, commentId });
      }, HIGHLIGHT_DELAY);
      return { ...state, [commentId]: level };
    }
    const newState = _.pickBy(state, (value, key) => key !== commentId);
    return { ...newState };
  }, {});

  return (
    <HighlightedCommentContext.Provider value={[state, dispatch]}>
      {children}
    </HighlightedCommentContext.Provider>
  );
}

export { HighlightedCommentContext, HighlightedCommentProvider };
