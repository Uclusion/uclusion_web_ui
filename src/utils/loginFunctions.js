import { formCurrentMarketLink, getMarketId } from './marketIdPathFunctions';
import appConfig from '../config/config';

import { postAuthTasks } from './postAuthFunctions';
import { intl } from '../components/IntlComponents/IntlGlobalProvider';
import { updateMarketAuth } from '../components/utils';


function login(type) {
  // set our market auth info so the react authorizer knows what kind we're doing
  updateMarketAuth(getMarketId(), { type, config: appConfig.api_configuration });
  // make an authorizer to kick off the flow

}

export function loginOidc() {
  return login('oidc');
}

export function loginSso() {
  return login('sso');
}

/**
 * Function to complete login anonymously. Takes the props
 * from a login page that have at least dispatch, history, webSocket and usersReducer defined.
 * @param props a properties object that has at least dispatch, history, webSocket and usersReducer defined
 */
export function loginAnonymous(props) {
  const { history } = props;
  updateMarketAuth(getMarketId(), {type: 'anonymous', config: appConfig.api_configuration});

}

/**
 * Handles cognito token generation
 * @props  a properties object that has at least dispatch, history, webSocket and usersReducer defined
 * @param response the response from cognito
 * @param cognitoAuthorizer the authorizer that handled the response
 * @param uiPostAutTasks any ui tasks that need to be run after auth
 */
export function cognitoTokenGenerated(props, authInfo, uiPostAuthTasks, doNotPush) {
  const { history } = props;
  return postAuthTasks(props, { ...authInfo })
    .then(() => {
      uiPostAuthTasks();
      if (!doNotPush) {
        history.push(authInfo.destination_page);
      }
    });
}

function convertErrorToString(error) {
  if (error.name) {
    // cognito section
    const { name } = error;
    switch (name) {
      case 'UserNotFoundException':
        return intl.formatMessage({ id: 'loginErrorUserNotFound' });
      case 'CodeMismatchException':
        return intl.formatMessage({ id: 'loginErrorInvalidCognitoResetCode' });
      default:
        return error.message;
    }
  }
  // our cognito sso section
  if (error.error_message) {
    const errorMessage = error.error_message;
    if (errorMessage.includes('Account id email mismatch')) {
      return intl.formatMessage({ id: 'loginErrorInvalidLogin' });
    }
    if (errorMessage.includes('Item does not exist')) {
      return intl.formatMessage({ id: 'loginErrorInvalidMarket' });
    }
    return errorMessage;
  }
  return intl.formatMessage({ id: 'loginUnknownLoginError' });
}

/**
 *  This function is insane because it's colapsing errors from two or three systems
 *   returns an i18n string for errors on login
 * @param error
 * @param stringConverter
 * function which takes error message and converts it to a string
 *
 * @returns promise resulting in string error to display to user
 */
export function getErrorMessageStringConverter(response, stringConverter) {
  return Promise.resolve(response)
    .then(result => response.json())
    .then(json => stringConverter(json))
    .catch(result => stringConverter(response));
}


export function getErrorMessage(response) {
  return getErrorMessageStringConverter(response, convertErrorToString);
}
