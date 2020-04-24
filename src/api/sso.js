import uclusion from 'uclusion_sdk';
import AmpifyIdentitySource from '../authorization/AmplifyIdentityTokenRefresher';
import config from '../config';
import { toastErrorAndThrow } from '../utils/userMessage';


export function getSSOInfo() {
  return new AmpifyIdentitySource().getIdentity()
    .then((idToken) => uclusion.constructSSOClient(config.api_configuration)
      .then((ssoClient) => ({ ssoClient, idToken })));
}

export function getMessages() {
  return getSSOInfo()
    .then((ssoInfo) => {
      const { ssoClient, idToken } = ssoInfo;
      return ssoClient.getMessages(idToken)
        .then((messages) => {
          return messages;
        });
    });
}

export const getAccount = () => {
  return getSSOInfo()
    .then((ssoInfo) => {
      const { idToken, ssoClient } = ssoInfo;
      return ssoClient.accountCognitoLogin(idToken)
        .then((loginInfo) => loginInfo.account);
    })
};

export function getMarketInfo(marketId) {
  return getSSOInfo()
    .then((ssoInfo) => {
      const { ssoClient, idToken } = ssoInfo;
      return ssoClient.getMarketInfo(idToken, marketId)
        .then((market) => market);
    });
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
