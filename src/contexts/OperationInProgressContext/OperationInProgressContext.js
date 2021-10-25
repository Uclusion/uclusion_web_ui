import React, { useEffect, useReducer } from 'react'
import { beginListening, START_OPERATION, STOP_OPERATION } from './operationInProgressMessages'

const OperationInProgressContext = React.createContext(false);

function OperationInProgressProvider (props) {
  const { children } = props;
  const [state, dispatch] = useReducer((state, action) => {
    const { value, msg } = action;
    if (msg === STOP_OPERATION) {
      if (state !== true) {
        // This is a NO OP because something is turning off a button initiated operation in progress
        return state;
      }
      return false;
    }
    if (msg === START_OPERATION) {
      if (state !== false) {
        // Shouldn't reach here but NO OP since preventing double click more important
        return state;
      }
      return true;
    }
    return value;
  }, true); // Default operation in progress to true for the versions fetch


  useEffect(() => {
    beginListening((msg) => dispatch({msg}));
    return () => {};
  }, []);

  return (
    <OperationInProgressContext.Provider value={[state, (value) => dispatch({value})]}>
      {children}
    </OperationInProgressContext.Provider>
  );
}

export { OperationInProgressContext, OperationInProgressProvider };
