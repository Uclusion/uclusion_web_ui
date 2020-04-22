import React, { useEffect, useReducer, useState } from 'react';
import _ from 'lodash';
import beginListening from './highligtedVotingContextMessages';

const HighlightedVotingContext = React.createContext({});
const HIGHLIGHT_DELAY = 300000;
export const HIGHTLIGHT_ADD = 'ADD';
export const HIGHLIGHT_REMOVE = 'REMOVE';

function HighlightedVotingProvider(props) {
  const { children } = props;

  const [state, dispatch] = useReducer((state, action) => {
    const { type, associatedUserId, level } = action;
    if (type === HIGHTLIGHT_ADD) {
      setTimeout(() => {
        dispatch({ type: HIGHLIGHT_REMOVE, associatedUserId });
      }, HIGHLIGHT_DELAY);
      return { ...state, [associatedUserId]: level };
    }
    const newState = _.pickBy(state, (value, key) => key !== associatedUserId);
    return { ...newState };
  }, {});

  const [isInitialization, setIsInitialization] = useState(true);

  useEffect(() => {
    if (isInitialization) {
      beginListening(dispatch);
      setIsInitialization(false);
    }
  }, [isInitialization]);

  return (
    <HighlightedVotingContext.Provider value={[state, dispatch]}>
      {children}
    </HighlightedVotingContext.Provider>
  );
}

export { HighlightedVotingContext, HighlightedVotingProvider };
