import React, { useEffect, useReducer } from 'react'
import reducer, {
  EMPTY_STATE,
  initializeVersionsAction,
  MY_STORED_EMPTY_STATE,
  VERSIONS_CONTEXT_NAMESPACE
} from './versionsContextReducer'
import beginListening from './versionsContextMessages'
import LocalForageHelper from '../../utils/LocalForageHelper'
import { isSignedOut } from '../../utils/userFunctions'
import { clearUclusionLocalStorage } from '../../components/localStorageUtils'

const VersionsContext = React.createContext(EMPTY_STATE);

function VersionsProvider(props) {
  // eslint-disable-next-line react/prop-types
  const { children } = props;
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);

  useEffect(() => {
    if (!isSignedOut()) {
      // console.debug('Versions context listening');
      beginListening(dispatch);
      // load state from storage
      const lfg = new LocalForageHelper(VERSIONS_CONTEXT_NAMESPACE);
      lfg.getState()
        .then((diskState) => {
          // Note: My stored empty state has the version set to INITIALIZATION
          // which lets the global version refresh know to turn on the global spin lock
          const myDiskState = diskState || MY_STORED_EMPTY_STATE;
          dispatch(initializeVersionsAction(myDiskState));
        });
    } else {
      clearUclusionLocalStorage(false);
    }
    return () => {};
  }, []);

  return (
    <VersionsContext.Provider value={[state, dispatch]}>
      {children}
    </VersionsContext.Provider>
  );
}

export { VersionsContext, VersionsProvider };
