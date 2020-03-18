import React, { useReducer } from 'react';

const HighlightedCommentContext = React.createContext({});
const HIGHLIGHT_DELAY = 300000;
export const HIGHTLIGHT_ADD = 'ADD';
export const HIGHLIGHT_REMOVE = 'REMOVE';
export const EXPANDED = 'EXPANDED';

function HighlightedCommentProvider(props) {
  const { children } = props;
  const [state, dispatch] = useReducer((state, action) => {
    const { type, commentId, level, newRepliesExpanded } = action;
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
    const { level: oldLevel } = oldCommentState;
    if (!newRepliesExpanded) {
      // Remove high lighting if closing this thread
      return { ...state, [commentId]: { repliesExpanded: newRepliesExpanded } };
    }
    return { ...state, [commentId]: { level: oldLevel, repliesExpanded: newRepliesExpanded } };
  }, {});

  return (
    <HighlightedCommentContext.Provider value={[state, dispatch]}>
      {children}
    </HighlightedCommentContext.Provider>
  );
}

export { HighlightedCommentContext, HighlightedCommentProvider };
