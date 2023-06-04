import React, { useEffect, useReducer } from 'react'
import { getUclusionLocalStorageItem } from '../../components/localStorageUtils'
import { ACCOUNT_CONTEXT_KEY, reducer } from './accountContextReducer'
import { beginListening } from './accountContextMessages'

const EMPTY_STATE = { account: {}, billingInfo: {}, user: {}, initializing: true };
const AccountContext = React.createContext(EMPTY_STATE);

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
    beginListening(dispatch);
  }, []);

  return (
    <AccountContext.Provider value={[state, dispatch]}>
      {children}
    </AccountContext.Provider>
  );
}

export { AccountContext, AccountProvider };