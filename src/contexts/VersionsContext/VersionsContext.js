import React, { useEffect, useState, useReducer } from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import reducer, { EMPTY_STATE, refreshVersionsAction } from './versionsContextReducer';
import beginListening from './versionsContextMessages';

import { getVersions } from '../../api/summaries';

const VersionsContext = React.createContext(EMPTY_STATE);

function VersionsProvider(props) {
  // eslint-disable-next-line react/prop-types
  const { children } = props;
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);
  const [isInitialization, setIsInitialization] = useState(true);

  useEffect(() => {
    if (isInitialization) {
      getVersions().then((versions) => {
        dispatch(refreshVersionsAction(versions));
        setIsInitialization(false);
      });
      console.debug('Versions context begining listening');
      beginListening(dispatch);
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
