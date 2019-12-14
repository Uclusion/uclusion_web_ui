import React, {useState} from 'react';

const OperationInProgressContext = React.createContext(false);

function OperationInProgressProvider(props) {
  const { children } = props;
  const [state, setState] = useState(false);
  return (
    <OperationInProgressContext.Provider value={[state, setState]}>
      {children}
    </OperationInProgressContext.Provider>
  );
}

export { OperationInProgressContext, OperationInProgressProvider };
