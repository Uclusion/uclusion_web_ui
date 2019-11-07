import React, { useEffect, useState, useReducer } from 'react';
import reducer, { EMPTY_STATE, initializeVersionsAction, VERSIONS_CONTEXT_NAMESPACE } from './versionsContextReducer';
import beginListening from './versionsContextMessages';
import { getVersions } from '../../api/summaries';
import LocalForageHelper from '../LocalForageHelper';

const VersionsContext = React.createContext(EMPTY_STATE);

function VersionsProvider(props) {
  // eslint-disable-next-line react/prop-types
  const { children } = props;
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);
  const [isInitialization, setIsInitialization] = useState(true);

  useEffect(() => {
    console.debug('Versions context listening');
    beginListening(dispatch);
    if (isInitialization) {
      // load state from storage
      const lfg = new LocalForageHelper(VERSIONS_CONTEXT_NAMESPACE);
      lfg.getState()
        .then((diskState) => getVersions().then((versions) => {
          dispatch(initializeVersionsAction(diskState, versions));
          setIsInitialization(false);
        }));
    }
    return () => {
    };
  }, [isInitialization]);

  return (
    <VersionsContext.Provider value={[state, dispatch]}>
      {children}
    </VersionsContext.Provider>
  );
}

export { VersionsContext, VersionsProvider };
