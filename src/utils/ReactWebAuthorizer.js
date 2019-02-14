import { OidcAuthorizer, SsoAuthorizer, AnonymousAuthorizer } from 'uclusion_authorizer_sdk';
import decode from 'jwt-decode';
import { getUclusionLocalStorageItem } from '../components/utils';
import { getAuthMarketId } from './marketIdPathFunctions';

const getLocalAuthInfo = () => {
  const authInfo = getUclusionLocalStorageItem('auth');
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
  const marketId = getAuthMarketId();
  const newPath = `/${marketId}/post_auth`;
  const currentPage = new URL(window.location.href);
  currentPage.pathname = newPath;
  return currentPage.toString();
};

/**
 * Used when I don't know anything about you (e.g. I have no authorization context)
 * @param marketId
 */
const doGenericAuthRedirect = (marketId) => {
  let location = `/${marketId}/Login?destinationPage=${window.location.pathname.split('/')[2]}`;
  const currentPage = new URL(window.location.href);
  if (currentPage.search.includes('authMarketId')) {
    const parsed = currentPage.search.substr(currentPage.search.indexOf('authMarketId'));
    const authMarketId = parsed.split('=')[1];
    location += `&authMarketId=${authMarketId}`;
  }
  console.log(`redirecting you to login at ${location}`);
  window.location = location;
};

class ReactWebAuthorizer {
  constructor(uclusionUrl) {
    this.uclusionUrl = uclusionUrl;
  }

  getAuthorizer() {
    const marketId = getAuthMarketId();
    const authInfo = getLocalAuthInfo();
    if (!authInfo || !authInfo.type) {
      doGenericAuthRedirect(marketId);
    }
    let authorizer = null;
    const config = { uclusionUrl: this.uclusionUrl, marketId };
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
      default:
        // I don't recognize this type of authorizer, so I'm going to make you log in again
        doGenericAuthRedirect(marketId);
    }
    return authorizer;
  }

  doAuthFromCurrentPage() {
    // / we're not pre-authorized, so kick them into authorization flow
    const marketId = getAuthMarketId();
    const authorizer = this.getAuthorizer();
    const pageUrl = window.location.href;
    const postAuthPage = getPostAuthPage();
    authorizer.authorize(pageUrl, pageUrl, postAuthPage)
      .then((redirectUrl) => {
        window.location = redirectUrl;
      }).catch((reject) => {
        console.log(reject);
        doGenericAuthRedirect(marketId);
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
    const authInfo = getLocalAuthInfo();
    if (authInfo && authInfo.token) {
      return new Promise(((resolve, reject) => {
        resolve(authInfo.token);
      }));
    }
    this.doAuthFromCurrentPage();
  }

  getToken() {
    const authInfo = getLocalAuthInfo();
    if (authInfo) {
      return authInfo.token;
    }
    return undefined;
  }
}

export default ReactWebAuthorizer;
