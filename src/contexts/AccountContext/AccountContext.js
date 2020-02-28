import React, { useEffect, useState } from 'react'
import { getUclusionLocalStorageItem, setUclusionLocalStorageItem } from '../../components/utils';
import { registerListener } from '../../utils/MessageBusUtils';
import { AUTH_HUB_CHANNEL } from '../WebSocketContext';
import { getAccount } from '../../api/uclusionClient';

const AccountContext = React.createContext(undefined);

const ACCOUNT_CONTEXT_KEY = 'account_context';

/** This is backed by local storage instead of index db, because I'm never
 * storing more than the account info here, and it's small
 * @param props
 * @constructor
 */
function AccountProvider(props) {
  const { children } = props;
  const defaultValue = getUclusionLocalStorageItem(ACCOUNT_CONTEXT_KEY);
  const [state, setState] = useState(defaultValue);
  const [isInitialization, setIsInitialization] = useState(true);

  useEffect(() => {
    setUclusionLocalStorageItem(ACCOUNT_CONTEXT_KEY, state);
    if (isInitialization) {
      registerListener(AUTH_HUB_CHANNEL, 'accountContext', (data) => {
        const { payload: { event } } = data;
        switch (event) {
          case 'signIn':
            return getAccount()
              .then((account) => {
                setState(account);
              });
          case 'signOut':
            setState(undefined);
        }
      });
      setIsInitialization(false);
    }
  }, [state, isInitialization, setState, setIsInitialization]);

  return (
    <AccountContext.Provider value={[state, setState]}>
      {children}
    </AccountContext.Provider>
  );
}

export { AccountContext, AccountProvider }