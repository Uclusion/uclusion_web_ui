import React, { useEffect, useReducer, useState } from 'react';
import LocalForageHelper from '../utils/LocalForageHelper';

const DismissTextContext = React.createContext({});
export const DISMISS = 'DISMISS';
const DISMISS_CONTEXT_NAMESPACE = 'dismiss_context';

function DismissTextProvider(props) {
  const { children } = props;
  const [state, dispatch] = useReducer((state, action) => {
    const { type, id, newState } = action;
    if (type === DISMISS) {
      const lfh = new LocalForageHelper(DISMISS_CONTEXT_NAMESPACE);
      const newDismissedState = { ...state, [id]: { dismissed: true} };
      lfh.setState(newDismissedState);
      return newDismissedState;
    }
    return newState;
  }, {});
  const [isInitialization, setIsInitialization] = useState(true);
  useEffect(() => {
    if (isInitialization) {
      const lfg = new LocalForageHelper(DISMISS_CONTEXT_NAMESPACE);
      lfg.getState()
        .then((state) => {
          if (state) {
            dispatch({ type: 'INIT', newState: state });
          }
        });
      setIsInitialization(false);
    }
    return () => {};
  }, [isInitialization, state]);

  return (
    <DismissTextContext.Provider value={[state, dispatch]}>
      {children}
    </DismissTextContext.Provider>
  );
}

export { DismissTextContext, DismissTextProvider };
