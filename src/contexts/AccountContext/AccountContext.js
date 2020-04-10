import React, { useEffect, useReducer, useState } from 'react';
import { getUclusionLocalStorageItem, setUclusionLocalStorageItem } from '../../components/utils';
import { reducer } from './accountContextReducer';
import { beginListening } from './accountContextMessages';
import { getAccount } from '../../api/sso';
import { updateAccount, updateBilling, updateInvoices } from './accountContextHelper';
import { getInvoices, getPaymentInfo } from '../../api/users';
import _ from 'lodash';

const EMPTY_STATE = { account: {}, billingInfo: {}, initializing: true };
const AccountContext = React.createContext(EMPTY_STATE);

const ACCOUNT_CONTEXT_KEY = 'account_context';

/** This is backed by local storage instead of index db, because I'm never
 * storing more than the account info here, and it's small
 * @param props
 * @constructor
 */
function AccountProvider (props) {
  const { children } = props;
  const defaultValue = getUclusionLocalStorageItem(ACCOUNT_CONTEXT_KEY) || EMPTY_STATE;
  const [state, dispatch] = useReducer(reducer, defaultValue);
  const [isInitialization, setIsInitialization] = useState(true);

  useEffect(() => {
    setUclusionLocalStorageItem(ACCOUNT_CONTEXT_KEY, state);
    if (isInitialization) {
      beginListening(dispatch);
      getAccount()
        .then((newAccount) => {
          updateAccount(dispatch, newAccount);
          const { billing_customer_id: customerId } = newAccount;
          if (!_.isEmpty(customerId)) {
            return getPaymentInfo()
              .then((paymentInfo) => {
                updateBilling(dispatch, paymentInfo);
                return getInvoices();
              })
              .then((invoices) => {
                updateInvoices(dispatch, invoices);
              });
          }
        });
      setIsInitialization(false);
    }
  }, [state, isInitialization, dispatch, setIsInitialization]);

  return (
    <AccountContext.Provider value={[state, dispatch]}>
      {children}
    </AccountContext.Provider>
  );
}

export { AccountContext, AccountProvider };