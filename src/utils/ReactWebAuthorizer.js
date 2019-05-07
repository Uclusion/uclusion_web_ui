import { OidcAuthorizer, SsoAuthorizer, AnonymousAuthorizer, CognitoAuthorizer } from 'uclusion_authorizer_sdk';
import decode from 'jwt-decode';
import { getMarketAuth } from '../components/utils';
import { getMarketId } from './marketIdPathFunctions';

/**
 * Returns the stored auth info for authorization
 * @returns {null|*} the correct token for either the uclusion planning or the regular market
 */
const getLocalAuthInfo = () => {
  const marketId = getMarketId() || 'account'; //dirty hack for account creation before market exists
  const authInfo = getMarketAuth(marketId);
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
  if (currentPage.search.includes('newLogin')) {
    location += '&newLogin=true';
  }
  if (currentPage.href.includes('#')) {
    location += `#${currentPage.href.split('#')[1]}`;
  }
  console.debug(`redirecting you to login at ${location}`);
  window.location = location;
};

class ReactWebAuthorizer {
  constructor(uclusionUrl) {
    this.uclusionUrl = uclusionUrl;
  }

  getAuthorizer() {
    const marketId = getMarketId();
    const authInfo = getLocalAuthInfo();
    if (authInfo === null || !authInfo || !authInfo.type) {
      return doGenericAuthRedirect();
    }
    const config = { uclusionUrl: this.uclusionUrl, marketId };
    switch (authInfo.type) {
      case 'oidc':
        return new OidcAuthorizer(config);
      case 'sso':
        return new SsoAuthorizer(config);
      case 'anonymous':
        return new AnonymousAuthorizer(config);
      case 'cognito':
        return new CognitoAuthorizer(config);
      default:
        // I don't recognize this type of authorizer, so I'm going to make you log in again
        return doGenericAuthRedirect();
    }
  }

  doAuthFromCurrentPage() {
    console.log('We are here in crazy');
    // / we're not pre-authorized, so kick them into authorization flow
    const authorizer = this.getAuthorizer();
    if (authorizer) {
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
