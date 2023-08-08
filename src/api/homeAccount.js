import { getIsInvited } from '../utils/redirectUtils';
import { getTokenStorageManager } from './singletons';
import AmpifyIdentitySource from '../authorization/AmplifyIdentityTokenRefresher';
import uclusion from 'uclusion_sdk';
import config from '../config';
import { toastErrorAndThrow } from '../utils/userMessage';
import { TOKEN_TYPE_ACCOUNT } from './tokenConstants';
import _ from 'lodash';

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
    let fullAccountData = null;
    // update our cache
    await ssoClient.accountCognitoLogin(idToken, getIsInvited()).then((responseAccountData) => {
      const { uclusion_token } = responseAccountData;
      fullAccountData = responseAccountData;
      // now load the token into storage so we don't have to keep doing it
      return tsm.storeToken(TOKEN_TYPE_ACCOUNT, HOME_ACCOUNT_ITEM_ID, uclusion_token);
    });
    accountData = _.omit(fullAccountData, 'demo');
    return fullAccountData;
  });
}


function homeAccountFetcher(){
  this.getToken = async () => {
    const login = await getLogin();
    return login?.uclusion_token;
  }
}
let accountClient = null;
export async function getAccountClient() {
  if(accountClient == null) {
    accountClient = await uclusion.constructClient({...config.api_configuration, tokenManager: homeAccountFetcher});
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
