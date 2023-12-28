import { getIsInvited } from '../utils/redirectUtils';
import { getAccountStorageManager } from './singletons';
import AmpifyIdentitySource from '../authorization/AmplifyIdentityTokenRefresher';
import uclusion from 'uclusion_sdk';
import config from '../config';
import { toastErrorAndThrow } from '../utils/userMessage';
import { handleMarketData } from '../utils/demoLoader';
import { OnboardingState } from '../contexts/AccountContext/accountUserContextHelper';
import { refreshNotifications } from './versionedFetchUtils';

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

    //we've expired, time to refresh
    const ssoInfo = await getSSOInfo();
    const { idToken, ssoClient } = ssoInfo;
    // update our cache
    const responseAccountData = await ssoClient.accountCognitoLogin(idToken, getIsInvited());
    const { uclusion_token, user } = responseAccountData;
    // load the demo into the contexts
    if (user.onboarding_state === OnboardingState.NeedsOnboarding) {
      // Go ahead and get notification refresh going so user sees grey affect once spinning over
      refreshNotifications();
      const accountFetcher = {};
      accountFetcher.getToken = () => {
        return Promise.resolve(uclusion_token);
      };
      // Cleaner as separate call but barely
      const response = await uclusion.constructClient({...config.api_configuration,
        tokenManager: accountFetcher}).then((client) => client.markets.getDemo());
      const { demo, user } = response;
      responseAccountData['user'] = user;
      await handleMarketData(demo);
    }
    // load the account into storage with the potentially updated user
    await asm.storeAccountData(responseAccountData);
    // Let the normal refresh get the messages as it will give time for the contexts to load the demo
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
