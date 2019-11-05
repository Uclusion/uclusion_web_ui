import React, { useEffect, useState, useReducer } from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import reducer, { refreshVersionsAction, VERSIONS_CONTEXT_NAMESPACE } from './versionsContextReducer';
import beginListening from './versionsContextMessages';
import { getUclusionLocalStorageItem, setUclusionLocalStorageItem } from '../../components/utils';
import { getVersions } from '../../api/summaries';

const EMPTY_STATE = {
  versions: [],
};

const VersionsContext = React.createContext(EMPTY_STATE);

function VersionsProvider(props) {
  // eslint-disable-next-line react/prop-types
  const { children } = props;
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);
  const [isInitialization, setIsInitialization] = useState(true);
  const haveLocalData = getUclusionLocalStorageItem(VERSIONS_CONTEXT_NAMESPACE);
  useEffect(() => {
    if (isInitialization || !haveLocalData) {
      getVersions().then((versions) => {
        dispatch(refreshVersionsAction(versions));
        setIsInitialization(false);
      });
      beginListening(dispatch);
      setUclusionLocalStorageItem(VERSIONS_CONTEXT_NAMESPACE, true);
    }
    return () => {
    };
  }, [isInitialization, haveLocalData]);

  return (
    <VersionsContext.Provider value={[state, dispatch]}>
      {children}
    </VersionsContext.Provider>
  );
}

export { VersionsContext, VersionsProvider };
