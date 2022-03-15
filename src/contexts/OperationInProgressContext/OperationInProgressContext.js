import React, { useEffect, useReducer } from 'react'
import { beginListening, START_OPERATION, STOP_OPERATION } from './operationInProgressMessages'

const OperationInProgressContext = React.createContext(false);

const reducer = (state, action) => {
  const { value, msg, id } = action;
  const expectedState = id ? id : true;
  if (msg === STOP_OPERATION) {
    if (state !== expectedState) {
      // This is a NO OP because something unknowingly turning off a button initiated operation in progress
      return state;
    }
    console.info('Stopping operation from message');
    return false;
  }
  if (msg === START_OPERATION) {
    if (state !== false) {
      // Shouldn't reach here but NO OP since preventing double click more important
      return state;
    }
    console.info('Starting operation from message');
    return expectedState;
  }
  console.info(`Setting operation ${value}`);
  return value;
};

function OperationInProgressProvider (props) {
  const { children } = props;
  const [state, dispatch] = useReducer(reducer, false);


  useEffect(() => {
    beginListening((msg, id) => dispatch({msg, id}));
    return () => {};
  }, []);

  return (
    <OperationInProgressContext.Provider value={[state, (value) => dispatch({value})]}>
      {children}
    </OperationInProgressContext.Provider>
  );
}

export { OperationInProgressContext, OperationInProgressProvider };
