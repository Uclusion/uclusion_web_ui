import React, { useReducer } from 'react';
import {
  getUclusionLocalStorageItem,
  setUclusionLocalStorageItem
} from '../components/localStorageUtils'

const DismissTextContext = React.createContext({});
export const DISMISS = 'DISMISS';
const DISMISS_CONTEXT_KEY = 'dismiss_text';


function DismissTextProvider(props) {
  const { children } = props;
  const stored = getUclusionLocalStorageItem(DISMISS_CONTEXT_KEY) || {};
  const [state, dispatch] = useReducer((state, action) => {
    const { type, id, newState } = action;
    if (type === DISMISS) {
      const newDismissedState = { ...state, [id]: { dismissed: true} };
      setUclusionLocalStorageItem(DISMISS_CONTEXT_KEY, newDismissedState);
      return newDismissedState;
    }
    return newState;
  }, stored);

  return (
    <DismissTextContext.Provider value={[state, dispatch]}>
      {children}
    </DismissTextContext.Provider>
  );
}

export { DismissTextContext, DismissTextProvider };
