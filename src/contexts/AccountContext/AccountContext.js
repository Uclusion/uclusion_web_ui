import React, { useEffect, useReducer } from 'react'
import { getUclusionLocalStorageItem, setUclusionLocalStorageItem } from '../../components/localStorageUtils'
import { reducer } from './accountContextReducer'
import { beginListening, PUSH_HOME_USER_CHANNEL } from './accountContextMessages'
import { isSignedOut } from '../../utils/userFunctions'
import { VERSIONS_EVENT } from '../../api/versionedFetchUtils'
import { pushMessage } from '../../utils/MessageBusUtils'

const EMPTY_STATE = { account: {}, billingInfo: {}, user: {}, initializing: true };
const AccountContext = React.createContext(EMPTY_STATE);

const ACCOUNT_CONTEXT_KEY = 'account_context';

/** This is backed by local storage instead of index db, because I'm never
 * storing more than the account info here, and it's small
 * @param props
 * @constructor
 */
function AccountProvider(props) {
  const { children } = props;
  const defaultValue = getUclusionLocalStorageItem(ACCOUNT_CONTEXT_KEY) || EMPTY_STATE;
  const [state, dispatch] = useReducer(reducer, defaultValue);

  useEffect(() => {
    setUclusionLocalStorageItem(ACCOUNT_CONTEXT_KEY, state);
  }, [state]);

  useEffect(() => {
    if (!isSignedOut()) {
      beginListening(dispatch);
      pushMessage(PUSH_HOME_USER_CHANNEL, { event: VERSIONS_EVENT });
    }
  }, []);

  return (
    <AccountContext.Provider value={[state, dispatch]}>
      {children}
    </AccountContext.Provider>
  );
}

export { AccountContext, AccountProvider };