import uclusion from 'uclusion_sdk';
import AmpifyIdentitySource from '../authorization/AmplifyIdentityTokenRefresher';
import config from '../config';

function getSSOInfo() {
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
