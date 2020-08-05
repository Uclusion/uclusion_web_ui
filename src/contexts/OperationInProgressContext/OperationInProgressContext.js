import React, { useEffect, useState } from 'react'
import { beginListening } from './operationInProgressMessages'

const OperationInProgressContext = React.createContext(false);

function OperationInProgressProvider (props) {
  const { children } = props;
  const [state, setState] = useState(false);

  useEffect(() => {
    beginListening(setState);
    return () => {};
  }, []);

  return (
    <OperationInProgressContext.Provider value={[state, setState]}>
      {children}
    </OperationInProgressContext.Provider>
  );
}

export { OperationInProgressContext, OperationInProgressProvider };
