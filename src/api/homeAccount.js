import { getAccountStorageManager } from './singletons';
import AmpifyIdentitySource from '../authorization/AmplifyIdentityTokenRefresher';
import uclusion from 'uclusion_sdk';
import config from '../config';
import { toastErrorAndThrow } from '../utils/userMessage';
import {
  getLogoutGeneration,
  isLogoutGenerationCurrent,
  isSignedOut,
} from '../utils/logoutState';

export const HOME_ACCOUNT_LOCK_NAME = 'home_account_login_lock';

class AccountLoginCancelledError extends Error {
  constructor () {
    super('Account login is no longer active');
    this.name = 'AccountLoginCancelledError';
    this.cancelled = true;
  }
}

function accountLoginIsCurrent(logoutGeneration) {
  return !isSignedOut() && isLogoutGenerationCurrent(logoutGeneration);
}

async function requireCurrentAccountLogin(logoutGeneration, accountStorageManager, hasLock) {
  if (accountLoginIsCurrent(logoutGeneration)) {
    return;
  }
  const error = new AccountLoginCancelledError();
  if (hasLock) {
    try {
      await accountStorageManager.clearAccountStorage();
    } catch (cleanupError) {
      error.cleanupError = cleanupError;
    }
  }
  throw error;
}

async function runCurrentAccountLoginStep(
  operation, logoutGeneration, accountStorageManager, hasLock
) {
  await requireCurrentAccountLogin(logoutGeneration, accountStorageManager, hasLock);
  let result;
  try {
    result = await operation();
  } catch (error) {
    if (!accountLoginIsCurrent(logoutGeneration)) {
      await requireCurrentAccountLogin(logoutGeneration, accountStorageManager, hasLock);
    }
    throw error;
  }
  await requireCurrentAccountLogin(logoutGeneration, accountStorageManager, hasLock);
  return result;
}

/**
 * The get login function does exactly one thing. Logs you in. It is used
 * _anywhere_ we need to log into your home account. It should be the _only_ thing in
 * the system that can log you into your home account.
 */

export async function getLogin(ifAvailable=false, accountVersion=null, userVersion=null) {
  const logoutGeneration = getLogoutGeneration();
  return navigator.locks.request(HOME_ACCOUNT_LOCK_NAME, {ifAvailable},
    async (aLock) => {
    console.info('Getting login');
    const asm = getAccountStorageManager();
    const hasLock = aLock !== null;
    const accountData = await runCurrentAccountLoginStep(
      () => asm.getValidAccount(), logoutGeneration, asm, hasLock
    );
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
    // we've expired, time to refresh
    const idToken = await runCurrentAccountLoginStep(
      () => new AmpifyIdentitySource().getIdentity(), logoutGeneration, asm, hasLock
    );
    const ssoClient = await runCurrentAccountLoginStep(
      () => uclusion.constructSSOClient(config.api_configuration),
      logoutGeneration,
      asm,
      hasLock
    );
    console.info('Getting account login');
    // update our cache
    const responseAccountData = await runCurrentAccountLoginStep(
      () => ssoClient.accountCognitoLogin(idToken), logoutGeneration, asm, hasLock
    );
    // load the account into storage
    await runCurrentAccountLoginStep(
      () => asm.storeAccountData(responseAccountData), logoutGeneration, asm, hasLock
    );
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

export function getDemo(isTeam){
  return getAccountClient()
    .then((client) => client.markets.getDemo(isTeam))
    .catch((error) => {
      return toastErrorAndThrow(error, 'errorDemoLoadFailed');
    });
}
