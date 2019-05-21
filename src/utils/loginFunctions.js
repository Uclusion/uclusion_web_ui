import { formCurrentMarketLink, getMarketId } from './marketIdPathFunctions';
import appConfig from '../config/config';
import { AnonymousAuthorizer, OidcAuthorizer, SsoAuthorizer } from 'uclusion_authorizer_sdk';
import { postAuthTasks } from './postAuthFunctions';
import { intl } from '../components/IntlComponents/IntlGlobalProvider';

const getPostAuthPage = () => {
  const currentPage = new URL(window.location.href);
  currentPage.pathname = '/post_auth';
  currentPage.search = '';
  return currentPage.toString();
};

function getDestinationPage(subPath, marketId) {
  const currentPage = new URL(window.location.href);
  currentPage.pathname = `/${marketId}/${subPath}`;
  return currentPage.toString();
}

export function getLoginParams(marketId) {
  const parsed = new URL(window.location.href);
  let page = parsed.searchParams.get('destinationPage') || 'investibles';
  if (parsed.href.includes('#')) {
    page += `#${parsed.href.split('#')[1]}`;
  }
  if (!marketId) {
    marketId = getMarketId();
  }
  const newLogin = parsed.searchParams.get('newLogin');
  let email = null;
  if (parsed.searchParams.get('email')) {
    email = decodeURIComponent(parsed.searchParams.get('email'));
  }
  const anonymousLogin = parsed.searchParams.get('anonymousLogin');
  const destinationPage = getDestinationPage(page, marketId);
  const redirectUrl = getPostAuthPage();
  const pageUrl = window.location.href;
  const uclusionUrl = appConfig.api_configuration.baseURL;
  console.debug(`page = ${page}`);
  console.debug(`destinationPage = ${destinationPage}`);
  console.debug(`redirectUrl = ${redirectUrl}`);
  const response = {
    marketId,
    destinationPage,
    redirectUrl,
    pageUrl,
    uclusionUrl,
    newLogin,
    page,
    anonymousLogin,
  };
  if (email) {
    response.email = email;
  }
  return response;
}

function doLoginRedirect(authorizer, loginParams) {
  const { pageUrl, destinationPage, redirectUrl } = loginParams;
  const redirectPromise = authorizer.authorize(pageUrl, destinationPage, redirectUrl);
  redirectPromise.then((location) => {
    console.debug(location);
    window.location = location;
  });
}

export function loginOidc() {
  const loginParams = getLoginParams();
  const authorizer = new OidcAuthorizer(loginParams);
  doLoginRedirect(authorizer, loginParams);
}

export function loginSso() {
  const loginParams = getLoginParams();
  const authorizer = new SsoAuthorizer(loginParams);
  doLoginRedirect(authorizer, loginParams);
}

/**
 * Function to complete login anonymously. Takes the props
 * from a login page that have at least dispatch, history, webSocket and usersReducer defined.
 * @param props a properties object that has at least dispatch, history, webSocket and usersReducer defined
 */
export function loginAnonymous(props) {
  const { history } = props;
  const loginParams = getLoginParams();
  const authorizer = new AnonymousAuthorizer(loginParams);
  authorizer.doPostAuthorize().then((resolve) => {
    const {
      uclusion_token, market_id, user, deployed_version, uclusion_user_id,
    } = resolve;
    const uclusionTokenInfo = {
      token: uclusion_token,
      type: authorizer.getType(),
    };
    if (uclusion_user_id) {
      uclusionTokenInfo.uclusion_user_id = uclusion_user_id;
    }
    postAuthTasks(props, deployed_version, uclusionTokenInfo, market_id, user);
    history.push(formCurrentMarketLink('investibles'));
  });
}

/**
 * Handles cognito token generation
 * @props  a properties object that has at least dispatch, history, webSocket and usersReducer defined
 * @param response the response from cognito
 * @param cognitoAuthorizer the authorizer that handled the response
 * @param uiPostAutTasks any ui tasks that need to be run after auth
 */
export function cognitoTokenGenerated(props, response, cognitoAuthorizer, uiPostAuthTasks, doNotPush) {
  const { history } = props;
  const { market_id: marketId } = response;
  const { page } = getLoginParams(marketId);
  console.debug(response);
  const uclusionTokenInfo = {
    token: cognitoAuthorizer.storedToken,
    type: cognitoAuthorizer.getType(),
  };
  if (response.uclusion_user_id) {
    uclusionTokenInfo.uclusion_user_id = response.uclusion_user_id;
  }
  postAuthTasks(props, response.deployed_version, uclusionTokenInfo,
    marketId, cognitoAuthorizer.user);
  uiPostAuthTasks();
  if (!doNotPush) {
    history.push(page);
  }
}

function convertErrorToString(error) {
  if (error.name) {
    //cognito section
    const { name } = error;
    switch(name) {
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
export function getErrorMessageStringConverter(response, stringConverter){
  return Promise.resolve(response)
    .then(result => response.json())
    .then(json => stringConverter(json))
    .catch(result => stringConverter(response));
}


export function getErrorMessage(response) {
  return getErrorMessageStringConverter(response, convertErrorToString);
}
