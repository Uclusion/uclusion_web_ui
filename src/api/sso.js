import uclusion from 'uclusion_sdk'
import AmpifyIdentitySource from '../authorization/AmplifyIdentityTokenRefresher'
import config from '../config'
import { toastErrorAndThrow } from '../utils/userMessage'
import { ACCOUNT_ITEM_ID, getAccountSSOClient } from './uclusionClient';
import { getIsInvited } from '../utils/redirectUtils';
import { getTokenStorageManager } from './singletons';
import { TOKEN_TYPE_ACCOUNT } from '../authorization/TokenStorageManager';

export function getSSOInfo() {
  return new AmpifyIdentitySource().getIdentity()
    .then((idToken) => uclusion.constructSSOClient(config.api_configuration)
      .then((ssoClient) => ({ ssoClient, idToken })));
}

export function getMessages() {
  return getAccountSSOClient()
    .then((ssoInfo) => {
      const { ssoClient, accountToken } = ssoInfo;
      return ssoClient.getMessages(accountToken);
    });
}

export function getAppVersion() {
  return getAccountSSOClient()
    .then((ssoInfo) => {
      const { ssoClient, accountToken } = ssoInfo;
      return ssoClient.getAppVersion(accountToken);
    });
}

export const login = async () => {
  const ssoInfo = await getSSOInfo()
  const { idToken, ssoClient } = ssoInfo;
  const accountData = ssoClient.accountCognitoLogin(idToken, getIsInvited());
  const { uclusion_token } = accountData;
  // now load the token into storage so we don't have to keep doing it
  const tsm = getTokenStorageManager();
  await tsm.storeToken(TOKEN_TYPE_ACCOUNT, ACCOUNT_ITEM_ID, uclusion_token);
  return accountData;
};

export function getMarketInfoForToken(marketToken) {
  return uclusion.constructSSOClient(config.api_configuration)
    .then((ssoClient) => ssoClient.getMarketInfoForToken(marketToken));
}

export function resendVerification(email, redirect) {
  return uclusion.constructSSOClient(config.api_configuration)
    .then((ssoClient) => ssoClient.resendVerification(email, redirect))
    .catch((error) => toastErrorAndThrow(error, 'errorResendFailed'));
}

/**
 * Signs the user up to the system
 * @param signupData an object contain { name, email, password, phone} where phone is optional
 * @param redirect
 */
export function signUp(signupData, redirect) {
  return uclusion.constructSSOClient(config.api_configuration)
    .then((ssoClient) => ssoClient.userSignup(signupData, redirect))
    .catch((error) => toastErrorAndThrow(error, 'errorSignupFailed'));
}

export function verifyEmail(code) {
  return uclusion.constructSSOClient(config.api_configuration)
    .then((ssoClient) => ssoClient.verifyEmail(code));
}
