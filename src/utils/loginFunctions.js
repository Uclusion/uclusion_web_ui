import { formCurrentMarketLink, getMarketId } from './marketIdPathFunctions';
import appConfig from '../config/config';
import { AnonymousAuthorizer, OidcAuthorizer, SsoAuthorizer } from 'uclusion_authorizer_sdk';
import { postAuthTasks } from './postAuthFunctions';

const getPostAuthPage = () => {
  const currentPage = new URL(window.location.href);
  currentPage.pathname = '/post_auth';
  currentPage.search = '';
  return currentPage.toString();
};

function getDestinationPage(subPath) {
  const currentPage = new URL(window.location.href);
  const marketId = getMarketId();
  currentPage.pathname = `/${marketId}/${subPath}`;
  return currentPage.toString();
}

export function getLoginParams() {
  const marketId = getMarketId();
  const parsed = new URL(window.location.href);
  let page = parsed.searchParams.get('destinationPage') || 'investibles';
  if (parsed.href.includes('#')) {
    page += `#${parsed.href.split('#')[1]}`;
  }
  const newLogin = parsed.searchParams.get('newLogin');
  const destinationPage = getDestinationPage(page, true);
  const redirectUrl = getPostAuthPage();
  const pageUrl = window.location.href;
  const uclusionUrl = appConfig.api_configuration.baseURL;
  console.debug(`page = ${page}`);
  console.debug(`destinationPage = ${destinationPage}`);
  console.debug(`redirectUrl = ${redirectUrl}`);
  return {
    marketId,
    destinationPage,
    redirectUrl,
    pageUrl,
    uclusionUrl,
    newLogin,
    page,
  };
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
  const { dispatch, history, webSocket, usersReducer } = props;
  const loginParams = getLoginParams();
  const authorizer = new AnonymousAuthorizer(loginParams);
  authorizer.doPostAuthorize().then((resolve) => {
    const {
      uclusion_token, market_id, user, deployed_version,
      uclusion_planning_token, uclusion_market_id, uclusion_user
    } = resolve;
    const uclusionTokenInfo = {
      token: uclusion_token,
      type: authorizer.getType(),
      planningToken: uclusion_planning_token,
      planningType: authorizer.getType(),
      planningMarketId: uclusion_market_id,
      planningUserId: uclusion_user.id,
    };
    postAuthTasks(usersReducer, deployed_version, uclusionTokenInfo, dispatch, market_id, user, webSocket);
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
export function cognitoTokenGenerated(props, response, cognitoAuthorizer, uiPostAuthTasks) {
  const { dispatch, webSocket, history, usersReducer } = props;
  const { marketId, page } = getLoginParams();
  console.debug(response);
  const uclusionTokenInfo = {
    token: cognitoAuthorizer.storedToken,
    type: cognitoAuthorizer.getType,
    planningToken: response.uclusion_planning_token,
    planningType: cognitoAuthorizer.getType,
    planningMarketId: response.uclusion_market_id,
    planningUserId: response.uclusion_user.id,
  };
  postAuthTasks(usersReducer, response.deployed_version, uclusionTokenInfo, dispatch,
    marketId, cognitoAuthorizer.user, webSocket);
  uiPostAuthTasks();
  history.push(page);
}




