import { OidcAuthorizer, SsoAuthorizer, AnonymousAuthorizer, CognitoAuthorizer } from 'uclusion_authorizer_sdk';
import decode from 'jwt-decode';
import { getUclusionLocalStorageItem } from '../components/utils';
import { getAuthMarketInfo, getMarketId } from './marketIdPathFunctions';

/**
 * Returns the stored auth info for authorization
 * @param inUclusionPlanning are we authorizing in the uclusion planning market?
 * @returns {null|*} the correct token for either the uclusion planning or the regular market
 */
const getLocalAuthInfo = (inUclusionPlanning) => {
  const storageKey = inUclusionPlanning ? 'planningAuth' : 'auth';
  const authInfo = getUclusionLocalStorageItem(storageKey);
  if (!authInfo) {
    return null;
  }
  const decodedToken = decode(authInfo.token);
  if (decodedToken.exp < Date.now() / 1000) {
    return null;
  }
  return authInfo;
};

const getPostAuthPage = () => {
  const currentPage = new URL(window.location.href);
  currentPage.pathname = '/post_auth';
  return currentPage.toString();
};

/**
 * Used when I don't know anything about you (e.g. I have no authorization context)
 */
const doGenericAuthRedirect = () => {
  let location = `/${getMarketId()}/Login?destinationPage=${window.location.pathname.split('/')[2]}`;
  const currentPage = new URL(window.location.href);
  if (currentPage.search.includes('authMarketId')) {
    const parsed = currentPage.search.substr(currentPage.search.indexOf('authMarketId'));
    const authMarketId = parsed.split('=')[1];
    location += `&authMarketId=${authMarketId}`;
  }
  if (currentPage.search.includes('newLogin')) {
    location += '&newLogin=true';
  }
  if (currentPage.href.includes('#')) {
    location += `#${currentPage.href.split('#')[1]}`;
  }
  console.log(`redirecting you to login at ${location}`);
  window.location = location;
};

class ReactWebAuthorizer {
  constructor(uclusionUrl) {
    this.uclusionUrl = uclusionUrl;
  }

  getAuthorizer() {
    const { authMarketId, inUclusionPlanning } = getAuthMarketInfo();
    const authInfo = getLocalAuthInfo(inUclusionPlanning);
    if (authInfo === null || !authInfo || !authInfo.type) {
      doGenericAuthRedirect();
    }
    let authorizer = null;
    const config = { uclusionUrl: this.uclusionUrl, marketId: authMarketId };
    switch (authInfo.type) {
      case 'oidc':
        authorizer = new OidcAuthorizer(config);
        break;
      case 'sso':
        authorizer = new SsoAuthorizer(config);
        break;
      case 'anonymous':
        authorizer = new AnonymousAuthorizer(config);
        break;
      case 'cognito':
        authorizer = new CognitoAuthorizer(config);
        break;
      default:
        // I don't recognize this type of authorizer, so I'm going to make you log in again
        doGenericAuthRedirect();
    }
    return authorizer;
  }

  doAuthFromCurrentPage() {
    // / we're not pre-authorized, so kick them into authorization flow
    const authorizer = this.getAuthorizer();
    const pageUrl = window.location.href;
    const postAuthPage = getPostAuthPage();
    authorizer.authorize(pageUrl, pageUrl, postAuthPage)
      .then((redirectUrl) => {
        window.location = redirectUrl;
      }).catch((reject) => {
        console.log(reject);
        doGenericAuthRedirect();
      });
  }

  /**
   * According to the contract we should use the redirect, etc, but we
   * can figure it out from the current page
   */
  reauthorize(redirectUrl, destinationUrl) {
    this.doAuthFromCurrentPage();
  }

  authorize() {
    const { inUclusionPlanning } = getAuthMarketInfo();
    const authInfo = getLocalAuthInfo(inUclusionPlanning);
    if (authInfo && authInfo.token) {
      return new Promise(((resolve, reject) => {
        resolve(authInfo.token);
      }));
    }
    this.doAuthFromCurrentPage();
  }

  getToken() {
    const { inUclusionPlanning } = getAuthMarketInfo();
    const authInfo = getLocalAuthInfo(inUclusionPlanning);
    if (authInfo) {
      return authInfo.token;
    }
    return undefined;
  }
}

export default ReactWebAuthorizer;
