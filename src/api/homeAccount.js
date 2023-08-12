import { getIsInvited } from '../utils/redirectUtils';
import { getTokenStorageManager } from './singletons';
import AmpifyIdentitySource from '../authorization/AmplifyIdentityTokenRefresher';
import uclusion from 'uclusion_sdk';
import config from '../config';
import { toastErrorAndThrow } from '../utils/userMessage';
import { TOKEN_TYPE_ACCOUNT } from './tokenConstants';

export const HOME_ACCOUNT_ITEM_ID = 'home_account';
export const HOME_ACCOUNT_LOCK_NAME = 'home_account_login_lock';


/**
 * The get login function does exactly one thing. Logs you in. It is used
 * _anywhere_ we need to log into your home account. It should be the _only_ thing in
 * the system that can log you into your home account.
 */

let accountData = null;

function getSSOInfo() {
  return new AmpifyIdentitySource().getIdentity()
    .then((idToken) => uclusion.constructSSOClient(config.api_configuration)
      .then((ssoClient) => ({ ssoClient, idToken })));
}

export async function getLogin () {
  return navigator.locks.request(HOME_ACCOUNT_LOCK_NAME, async () => {
    const tsm = getTokenStorageManager();
    if (accountData && tsm.getValidToken(TOKEN_TYPE_ACCOUNT, HOME_ACCOUNT_ITEM_ID)) {
      // our account is still valid, so just return the stored account data
      return accountData;
    }
    //we've expired, time to refresh
    const ssoInfo = await getSSOInfo();
    const { idToken, ssoClient } = ssoInfo;
    // update our cache
    const responseAccountData = await ssoClient.accountCognitoLogin(idToken, getIsInvited());
    const { uclusion_token } = responseAccountData;
    accountData = responseAccountData;
    // now load the token into storage so we don't have to keep doing it
    await tsm.storeToken(TOKEN_TYPE_ACCOUNT, HOME_ACCOUNT_ITEM_ID, uclusion_token);
    return accountData;
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
