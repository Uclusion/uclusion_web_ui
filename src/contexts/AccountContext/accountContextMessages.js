import { registerListener } from '../../utils/MessageBusUtils';
import { AUTH_HUB_CHANNEL } from '../WebSocketContext';
import { accountAndUserRefresh, clearAccount } from './accountContextReducer'
import { VERSIONS_EVENT } from '../../api/versionedFetchUtils'
import { fixDates, updateBilling, updateInvoices } from './accountContextHelper'
import _ from 'lodash'
import { getInvoices, getPaymentInfo } from '../../api/users'
import { isSignedOut } from '../../utils/userFunctions';
import { getLogin } from '../../api/homeAccount';

export const PUSH_HOME_USER_CHANNEL = 'HomeUserChannel';
export const PUSH_ACCOUNT_CHANNEL = 'AccountChannel';

export function poll(dispatch, accountVersion, userVersion) {
  // TODO: need to try again after interval if this doesn't work but also needs to respond to await so tough
    return getLogin(true, accountVersion, userVersion).then((loginInfo) => {
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
          }
        }
      });
}

export function beginListening(dispatch) {
  registerListener(AUTH_HUB_CHANNEL, 'accountContext', (data) => {
    const { payload: { event } } = data;
    switch (event) {
      case 'signIn':
        // Trying move this to app with auth
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
        console.log(`Starting poll after user versions for ${version}`);
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
        console.log(`Starting poll after account versions for ${version}`);
        poll(dispatch, version, undefined);
        break;
      default:
        break;
    }
  });
}