import React, { useEffect, useState } from 'react'
import { beginListening } from './operationInProgressMessages'

const OperationInProgressContext = React.createContext(false);

function OperationInProgressProvider (props) {
  const { children } = props;
  // Default operation in progress to true for the versions fetch
  const [state, setState] = useState(true);
  const [operationTimer, setOperationTimer] = useState(undefined);

  useEffect(() => {
    beginListening(setState);
    return () => {};
  }, []);

  useEffect(() => {
    // Cannot risk user being locked out if an operation doesn't complete
    // since at that point the guard against parallel operations more dangerous than the operations
    if (state) {
      setOperationTimer(setInterval(() => {
        setState(false);
      }, 3500));
    } else if (operationTimer) {
      clearInterval(operationTimer);
    }
    return () => {};
  }, [operationTimer, state]);

  return (
    <OperationInProgressContext.Provider value={[state, setState]}>
      {children}
    </OperationInProgressContext.Provider>
  );
}

export { OperationInProgressContext, OperationInProgressProvider };
