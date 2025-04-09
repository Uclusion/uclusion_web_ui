import { getIsInvited } from '../utils/redirectUtils';
import { getAccountStorageManager } from './singletons';
import AmpifyIdentitySource from '../authorization/AmplifyIdentityTokenRefresher';
import uclusion from 'uclusion_sdk';
import config from '../config';
import { toastErrorAndThrow } from '../utils/userMessage';

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

export async function getLogin(ifAvailable=false, accountVersion=null, userVersion=null) {
  return navigator.locks.request(HOME_ACCOUNT_LOCK_NAME, {ifAvailable},
    async (aLock) => {
    console.info('Getting login');
    const asm = getAccountStorageManager();
    const accountData = await asm.getValidAccount();
    if (accountData) {
      const updateRequired = (accountVersion != null && accountVersion > accountData.account.version)
        || (userVersion != null && userVersion > accountData.user.version);
      if (!updateRequired) {
        // our account is still valid, so just return the stored account data
        return accountData;
      }
    }

    // This is lock is for calling Cognito from poller - if had on disk above go ahead and return
    if (ifAvailable && aLock === null) {
      // For polling avoid these calls piling up
      return undefined;
    }
    console.info('Getting SSO info');
    //we've expired, time to refresh
    const ssoInfo = await getSSOInfo();
    const { idToken, ssoClient } = ssoInfo;
    console.info('Getting account login');
    // update our cache
    const responseAccountData = await ssoClient.accountCognitoLogin(idToken, getIsInvited());
    // load the account into storage
    await asm.storeAccountData(responseAccountData);
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

export function getDemo(){
  return getAccountClient()
    .then((client) => client.markets.getDemo())
    .catch((error) => {
      if (error.status !== 404) {
        toastErrorAndThrow(error, 'errorDemoLoadFailed');
      } else {
        console.error('Ignoring 404 on get demo as means demo load was called already');
      }
    });
}
