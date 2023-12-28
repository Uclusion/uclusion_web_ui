import { getIsInvited } from '../utils/redirectUtils';
import { getAccountStorageManager } from './singletons';
import AmpifyIdentitySource from '../authorization/AmplifyIdentityTokenRefresher';
import uclusion from 'uclusion_sdk';
import config from '../config';
import { toastErrorAndThrow } from '../utils/userMessage';
import { pushMessage } from '../utils/MessageBusUtils';
import { LOGIN_EVENT, NOTIFICATIONS_HUB_CHANNEL } from './versionedFetchUtils';
import { handleMarketData } from '../utils/demoLoader';
import { OnboardingState } from '../contexts/AccountContext/accountUserContextHelper';

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

export async function getLogin(ifAvailable=false) {
  return navigator.locks.request(HOME_ACCOUNT_LOCK_NAME, {ifAvailable},
    async (aLock) => {
    const asm = getAccountStorageManager();
    const accountData = await asm.getValidAccount();
    if (accountData) {
      // our account is still valid, so just return the stored account data
      return accountData;
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
    // do post login handling - TODO:_ move this to a post login handler if there's ever more
    const notifications = await ssoClient.getMessages(uclusion_token);
    // the push the notifications
    pushMessage(NOTIFICATIONS_HUB_CHANNEL, {event: LOGIN_EVENT, messages: notifications});
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
