import { formCurrentMarketLink, getMarketId } from './marketIdPathFunctions';
import appConfig from '../config/config';

import { postAuthTasks } from './postAuthFunctions';
import { intl } from '../components/IntlComponents/IntlGlobalProvider';
import { setMarketAuth } from '../components/utils';
import ReactWebAuthorizer from './ReactWebAuthorizer';

function login(type) {
  // set our market auth info so the react authorizer knows what kind we're doing
  setMarketAuth(getMarketId(), { type });
  // make an authorizer to kick off the flow
  const authorizer = new ReactWebAuthorizer(appConfig.api_configuration);
  return authorizer.authorize();
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
  setMarketAuth(getMarketId(), 'anonymous');
  const authorizer = new ReactWebAuthorizer(appConfig.api_configuration);
  authorizer.authorize().then((uclusionLogin) => {
    const {
      uclusion_token, market_id, user, deployed_version, uclusion_user_id,
    } = uclusionLogin;
    const uclusionTokenInfo = {
      token: uclusion_token,
      type: authorizer.getType(),
    };
    if (uclusion_user_id) {
      uclusionTokenInfo.uclusion_user_id = uclusion_user_id;
    }
    return postAuthTasks(props, deployed_version, uclusionTokenInfo, market_id, user)
      .then(() => {
        history.push(formCurrentMarketLink('investibles'));
      });
  });
}

/**
 * Handles cognito token generation
 * @props  a properties object that has at least dispatch, history, webSocket and usersReducer defined
 * @param response the response from cognito
 * @param cognitoAuthorizer the authorizer that handled the response
 * @param uiPostAutTasks any ui tasks that need to be run after auth
 */
export function cognitoTokenGenerated(props, response, cognitoAuthorizer, uiPostAuthTasks, destination, doNotPush) {
  const { history } = props;
  const { market_id: marketId } = response;
  console.debug(response);
  const uclusionTokenInfo = {
    token: cognitoAuthorizer.storedToken,
    type: cognitoAuthorizer.getType(),
  };
  if (response.uclusion_user_id) {
    uclusionTokenInfo.uclusion_user_id = response.uclusion_user_id;
  }
  return postAuthTasks(props, response.deployed_version, uclusionTokenInfo, marketId, cognitoAuthorizer.user)
    .then(() => {
      uiPostAuthTasks();
      if (!doNotPush) {
        history.push(destination);
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
