import { toastErrorAndThrow } from '../utils/userMessage'
import { getLogin } from './homeAccount';
import { SSO_CLIENT } from './singletons';


export async function getMessages() {
  const homeAccount = await getLogin();
  const {uclusion_token: accountToken} = homeAccount;
  return SSO_CLIENT.getMessages(accountToken);
}

export async function getAppVersion() {
  const homeAccount = await getLogin();
  const {uclusion_token: accountToken} = homeAccount;
  return SSO_CLIENT.getAppVersion(accountToken);
}


export function getMarketInfoForToken(marketToken) {
  return SSO_CLIENT.getMarketInfoForToken(marketToken);
}

export function resendVerification(email, redirect) {
  return SSO_CLIENT.resendVerification(email, redirect)
    .catch((error) => toastErrorAndThrow(error, 'errorResendFailed'));
}

/**
 * Signs the user up to the system
 * @param signupData an object contain { name, email, password, phone} where phone is optional
 * @param redirect
 */
export function signUp(signupData, redirect) {
  return SSO_CLIENT.userSignup(signupData, redirect)
    .catch((error) => toastErrorAndThrow(error, 'errorSignupFailed'));
}

export function verifyEmail(code) {
  return SSO_CLIENT.verifyEmail(code);
}
