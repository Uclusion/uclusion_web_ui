import { registerListener } from '../../utils/MessageBusUtils';
import { AUTH_HUB_CHANNEL } from '../WebSocketContext';
import { accountAndUserRefresh, clearAccount } from './accountContextReducer'
import { VERSIONS_EVENT } from '../../api/versionedFetchUtils'
import { fixDates, updateBilling, updateInvoices } from './accountContextHelper'
import _ from 'lodash'
import { getInvoices, getPaymentInfo } from '../../api/users'
import { isSignedOut } from '../../utils/userFunctions';
import { getLogin } from '../../api/homeAccount';
import { Auth } from 'aws-amplify';

export const PUSH_HOME_USER_CHANNEL = 'HomeUserChannel';
export const PUSH_ACCOUNT_CHANNEL = 'AccountChannel';

function poll(dispatch, accountVersion, userVersion) {
    Auth.currentSession().then(() => {
      return getLogin(true, true).then((loginInfo) => {
          if (loginInfo) {
            console.log('In poll after login');
            const { account, user } = loginInfo;
            const { version: founderUserVersion } = user;
            const { version: founderAccountVersion } = account;
            if ((accountVersion === undefined || accountVersion <= founderAccountVersion)
              && (userVersion === undefined || userVersion <= founderUserVersion)) {
              dispatch(accountAndUserRefresh(fixDates(account), user));
              const { billing_customer_id: customerId } = account;
              // handle billing
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
            } else {
              setTimeout(() => poll(dispatch, accountVersion, userVersion), 500);
            }
          }
        });
      }).catch(() => {
        setTimeout(() => poll(dispatch, accountVersion, userVersion), 1000);
      });
}

export function beginListening(dispatch) {
  registerListener(AUTH_HUB_CHANNEL, 'accountContext', (data) => {
    const { payload: { event } } = data;
    switch (event) {
      case 'signIn':
        console.log('Starting poll after sign in');
        poll(dispatch);
        break;
      case 'signOut':
        dispatch(clearAccount());
        break;
      default:
        break;
    }
  });
  registerListener(PUSH_HOME_USER_CHANNEL, 'accountHomeUser', (data) => {
    if (isSignedOut()) {
      return; // do nothing when signed out
    }
    const { payload: { event, version } } = data;
    switch (event) {
      case VERSIONS_EVENT:
        poll(dispatch, undefined, version);
        break;
      default:
        break;
    }
  });
  registerListener(PUSH_ACCOUNT_CHANNEL, 'accountHomeUser', (data) => {
    if (isSignedOut()) {
      return; // do nothing when signed out
    }
    const { payload: { event, version } } = data;
    switch (event) {
      case VERSIONS_EVENT:
        poll(dispatch, version, undefined);
        break;
      default:
        break;
    }
  });
  // If there is a refresh while signed in then need to reload
  poll(dispatch);
}