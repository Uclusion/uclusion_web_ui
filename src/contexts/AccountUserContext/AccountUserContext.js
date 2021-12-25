import React, { useEffect, useReducer } from 'react'
import {
  clearUclusionLocalStorage,
  getUclusionLocalStorageItem,
  setUclusionLocalStorageItem
} from '../../components/localStorageUtils'
import { reducer, resetState } from './accountUserContextReducer'
import { beginListening } from './accountUserContextMessages'
import _ from 'lodash'
import { isSignedOut } from '../../utils/userFunctions'

export const EMPTY_STATE = {};
const AccountUserContext = React.createContext(EMPTY_STATE);

const ACCOUNT_USER_CONTEXT_KEY = 'account_user_context';

/** This is backed by local storage instead of index db, because I'm never
 * storing more than the user preferences info here, and it's small
 * @param props
 * @constructor
 */
function AccountUserProvider (props) {
  const { children, authState } = props;
  const defaultValue = getUclusionLocalStorageItem(ACCOUNT_USER_CONTEXT_KEY) || EMPTY_STATE;
  const [state, dispatch] = useReducer(reducer, defaultValue);

  useEffect(() => {
    if (!isSignedOut()) {
      beginListening(dispatch);
    } else {
      clearUclusionLocalStorage(false);
    }
    return () => {}
  }, []);

  useEffect(() => {
    if (!isSignedOut()) {
      setUclusionLocalStorageItem(ACCOUNT_USER_CONTEXT_KEY, state);
      // We do not call the API here because the account might not be created yet (async)
      if (!_.isEmpty(state) && authState !== 'signedIn') {
        dispatch(resetState());
      }
    }
    return () => {
    }
  }, [state, authState]);

  return (
    <AccountUserContext.Provider value={[state, dispatch]}>
      {children}
    </AccountUserContext.Provider>
  );
}

export { AccountUserContext, AccountUserProvider };