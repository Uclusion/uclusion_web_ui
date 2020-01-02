import uclusion from 'uclusion_sdk';
import AmpifyIdentitySource from '../authorization/AmplifyIdentityTokenRefresher';
import config from '../config';


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
          console.debug('Got messages');
          console.debug(messages);
          return messages;
        });
    });
}

export function signUp(name, email, password, redirect) {
  return uclusion.constructSSOClient(config.api_configuration)
    .then((ssoClient) => ssoClient.userSignup(name, email, password, redirect));
}

export function verifyEmail(code) {
  return uclusion.constructSSOClient(config.api_configuration)
    .then((ssoClient) => ssoClient.verifyEmail(code));
}