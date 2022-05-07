import uclusion from 'uclusion_sdk'
import AmpifyIdentitySource from '../authorization/AmplifyIdentityTokenRefresher'
import config from '../config'
import { toastErrorAndThrow } from '../utils/userMessage'
import { getAccountSSOClient } from './uclusionClient';

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

/** Gets the home account user for the current logged in user
 */
export function getHomeAccountUser () {
  // Note, because it's at the SSO level, we don't use the uclusionClientWrappers
  return getAccount().then((loginInfo) => {
    const { user } = loginInfo;
    return user;
  }).catch((error) => {
    toastErrorAndThrow(error, 'errorHomeUserFetchFailed');
  });
}

export const getAccount = () => {
  return getSSOInfo()
    .then((ssoInfo) => {
      const { idToken, ssoClient } = ssoInfo;
      return ssoClient.accountCognitoLogin(idToken)
    })
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
