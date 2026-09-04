import { registerListener, removeListener } from '../../utils/MessageBusUtils';
import { accountAndUserRefresh, clearAccount } from './accountContextReducer'
import { VERSIONS_EVENT } from '../../api/versionedFetchUtils'
import { fixDates } from './accountContextHelper'
import { isSignedOut } from '../../utils/userFunctions';
import { getLogin } from '../../api/homeAccount';
import { isEditingPaused, onEditingResumed } from '../../utils/editingPause';

export const PUSH_HOME_USER_CHANNEL = 'HomeUserChannel';
export const PUSH_ACCOUNT_CHANNEL = 'AccountChannel';
export const AUTH_HUB_CHANNEL = 'auth';

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
          }
          return user;
        }
      });
}

export function beginListening(dispatch) {
  let pendingAccountVersion;
  let pendingUserVersion;
  let unsubscribeResume;

  const clearPending = () => {
    unsubscribeResume?.();
    unsubscribeResume = undefined;
    pendingAccountVersion = undefined;
    pendingUserVersion = undefined;
  };
  const refreshFromPush = (accountVersion, userVersion) => {
    if (!isEditingPaused()) {
      poll(dispatch, accountVersion, userVersion)
        .catch(() => console.warn('Error refreshing account from push'));
      return;
    }
    if (accountVersion !== undefined) {
      pendingAccountVersion = Math.max(pendingAccountVersion ?? accountVersion, accountVersion);
    }
    if (userVersion !== undefined) {
      pendingUserVersion = Math.max(pendingUserVersion ?? userVersion, userVersion);
    }
    if (!unsubscribeResume) {
      unsubscribeResume = onEditingResumed(() => {
        const accountVersion = pendingAccountVersion;
        const userVersion = pendingUserVersion;
        clearPending();
        if (!isSignedOut()) {
          refreshFromPush(accountVersion, userVersion);
        }
      });
    }
  };
  registerListener(AUTH_HUB_CHANNEL, 'accountContext', (data) => {
    const { payload: { event } } = data;
    switch (event) {
      case 'signIn':
        // Trying move this to app with auth
        break;
      case 'signOut':
        clearPending();
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
        refreshFromPush(undefined, version);
        break;
      default:
        break;
    }
  });
  registerListener(PUSH_ACCOUNT_CHANNEL, 'accountAccount', (data) => {
    if (isSignedOut()) {
      return; // do nothing when signed out
    }
    const { payload: { event, version } } = data;
    switch (event) {
      case VERSIONS_EVENT:
        console.log(`Starting poll after account versions for ${version}`);
        refreshFromPush(version, undefined);
        break;
      default:
        break;
    }
  });
  return () => {
    clearPending();
    removeListener(AUTH_HUB_CHANNEL, 'accountContext');
    removeListener(PUSH_HOME_USER_CHANNEL, 'accountHomeUser');
    removeListener(PUSH_ACCOUNT_CHANNEL, 'accountAccount');
  };
}
