import { toastErrorAndThrow } from '../utils/userMessage'
import { getLogin } from './homeAccount';
import { SSO_CLIENT } from './singletons';
import { getSignupMarketSubType } from '../utils/redirectUtils';
import { resolveSignupTestObject } from '../utils/signupMarketUtils';


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

// The SSO server answers 403 when the "I am human" check refused the request
function humanCheckAwareMessageKey(error, messageKey) {
  return error?.status === 403 ? 'errorHumanCheckFailed' : messageKey;
}

export function resendVerification(email, redirect, testObject, humanCheckToken) {
  const signupTestObject = resolveSignupTestObject(
    testObject,
    getSignupMarketSubType()
  );
  return SSO_CLIENT.resendVerification(email, redirect, signupTestObject, humanCheckToken)
    .catch((error) => toastErrorAndThrow(error, humanCheckAwareMessageKey(error, 'errorResendFailed')));
}

/**
 * Signs the user up to the system
 * @param signupData an object contain { name, email, password, phone, human_check_token } where phone is optional
 * @param redirect
 */
export function signUp(signupData, redirect) {
  return SSO_CLIENT.userSignup(signupData, redirect)
    .catch((error) => toastErrorAndThrow(error, humanCheckAwareMessageKey(error, 'errorSignupFailed')));
}

export function verifyEmail(code) {
  return SSO_CLIENT.verifyEmail(code);
}
