import React, { useEffect, useReducer } from 'react'
import { getUclusionLocalStorageItem, setUclusionLocalStorageItem } from '../../components/localStorageUtils'
import { reducer } from './accountContextReducer'
import { beginListening } from './accountContextMessages'
import { getAccount } from '../../api/sso'
import { updateAccount, updateBilling, updateInvoices } from './accountContextHelper'
import { getInvoices, getPaymentInfo } from '../../api/users'
import _ from 'lodash'
import { isSignedOut } from '../../utils/userFunctions'

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

  useEffect(() => {
    setUclusionLocalStorageItem(ACCOUNT_CONTEXT_KEY, state);
  }, [state]);

  useEffect(() => {
    if (!isSignedOut()) {
      beginListening(dispatch);
      getAccount()
        .then((loginInfo) => {
          const { account } = loginInfo
          updateAccount(dispatch, account);
          const { billing_customer_id: customerId } = account;
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
    }
  }, []);

  return (
    <AccountContext.Provider value={[state, dispatch]}>
      {children}
    </AccountContext.Provider>
  );
}

export { AccountContext, AccountProvider };