import { getIsInvited } from '../utils/redirectUtils';
import { getAccountStorageManager, getTokenStorageManager } from './singletons';
import AmpifyIdentitySource from '../authorization/AmplifyIdentityTokenRefresher';
import uclusion from 'uclusion_sdk';
import config from '../config';
import { toastErrorAndThrow } from '../utils/userMessage';
import { TOKEN_TYPE_ACCOUNT } from './tokenConstants';
import { pushMessage, registerListener } from '../utils/MessageBusUtils';
import { LOGIN_EVENT, NOTIFICATIONS_HUB_CHANNEL, NOTIFICATIONS_HUB_CONTROL_PLANE_CHANNEL } from './versionedFetchUtils';
import { LOGIN_LOADED_EVENT } from '../contexts/NotificationsContext/notificationsContextMessages';

export const HOME_ACCOUNT_ITEM_ID = 'home_account';
export const HOME_ACCOUNT_LOCK_NAME = 'home_account_login_lock';


/**
 * The get login function does exactly one thing. Logs you in. It is used
 * _anywhere_ we need to log into your home account. It should be the _only_ thing in
 * the system that can log you into your home account.
 */

function getSSOInfo() {
  return new AmpifyIdentitySource().getIdentity()
    .then((idToken) => uclusion.constructSSOClient(config.api_configuration)
      .then((ssoClient) => ({ ssoClient, idToken })));
}

export async function getLogin (forceRefresh) {
  return navigator.locks.request(HOME_ACCOUNT_LOCK_NAME, async () => {
    const asm = getAccountStorageManager();
    const accountData = await asm.getValidAccount(HOME_ACCOUNT_ITEM_ID);
    if (!forceRefresh && accountData) {
      // our account is still valid, so just return the stored account data
      return accountData;
    }

    //we've expired, time to refresh
    const ssoInfo = await getSSOInfo();
    const { idToken, ssoClient } = ssoInfo;
    // update our cache
    const responseAccountData = await ssoClient.accountCognitoLogin(idToken, getIsInvited());
    const { uclusion_token } = responseAccountData;
    // do post login handling - TODO:_ move this to a post login handler if there's ever more
    const notifications = await ssoClient.getMessages(uclusion_token);
    //block and ensure the context has the messages before we move forward
    await new Promise((resolve) => {
      // first register the listener
      registerListener(NOTIFICATIONS_HUB_CONTROL_PLANE_CHANNEL, 'loginLocker', (message) => {
        const { payload: { event } } = message;
        switch (event) {
          case(LOGIN_LOADED_EVENT): {
            resolve(true);
            break;
          }
          default: {
            console.error(`Got unknown event ${event} during login`);
          }
        }
      });
      // the push the notifications
      pushMessage(NOTIFICATIONS_HUB_CHANNEL, {event: LOGIN_EVENT, messages: notifications});
    });

    // now load the account into storage so we don't have to keep fetching it
    await asm.storeAccount(HOME_ACCOUNT_ITEM_ID, responseAccountData);
    return responseAccountData;
  });
}

let accountClient = null;
export async function getAccountClient() {
  if(accountClient == null) {
    const accountFetcher = {};
    accountFetcher.getToken = async () => {
      const login = await getLogin();
      return login?.uclusion_token;
    };
    accountClient = await uclusion.constructClient({...config.api_configuration,
      tokenManager: accountFetcher});
  }
  return accountClient;
}

/** Updates the logged in identity's home user account UI preferences
 * to be what's passed in. It's a _total_ replacement
 * @param newPreferences
 * @returns {*}
 */
export function updateUiPreferences(newPreferences){
  const stringData = JSON.stringify(newPreferences);
  return getAccountClient()
    .then((client) => client.users.update({ uiPreferences: stringData}))
    .catch((error) => toastErrorAndThrow(error, 'errorPreferenceUpdateFailed'));
}
