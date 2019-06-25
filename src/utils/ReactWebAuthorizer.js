import { OidcAuthorizer, SsoAuthorizer, AnonymousAuthorizer, CognitoAuthorizer } from 'uclusion_authorizer_sdk';
import decode from 'jwt-decode';
import { getMarketAuth } from '../components/utils';
import { getMarketId } from './marketIdPathFunctions';



/**
 * Returns the stored auth info for authorization
 * @returns object an object containing a validity flag, and any other auth info
 */
const getLocalAuthInfo = () => {
  const marketId = getMarketId() || 'account'; //dirty hack for account creation before market exists
  const authInfo = getMarketAuth(marketId);
  if (!authInfo) {
    return { valid: false };
  }
  if (!authInfo.token){
    return { ...authInfo, valid: false};
  }
  const decodedToken = decode(authInfo.token);
  if (decodedToken.exp < Date.now() / 1000) { //expiry is in _seconds_ past the epoch not millis
    return { ...authInfo, valid: false };
  }
  return { ...authInfo, valid: true };
};


export function amAlreadyLoggedIn() {
  const authInfo = getLocalAuthInfo();
  const { valid } = authInfo;
  return valid;
}

const getPostAuthPage = () => {
  const currentPage = new URL(window.location.href);
  currentPage.pathname = '/post_auth';
  return currentPage.toString();
};

const getUnknownLoginTypeLocation = () => {
  let location = `/${getMarketId()}/Login?destinationPage=${window.location.pathname.split('/')[2]}`;
  const currentPage = new URL(window.location.href);
  if (currentPage.search.includes('newLogin')) {
    location += '&newLogin=true';
  }
  if (currentPage.search.includes('email')) {
    location += `&email=${currentPage.search.split('email=')[1]}`;
  }
  if (currentPage.href.includes('#')) {
    location += `#${currentPage.href.split('#')[1]}`;
  }
  return location;
};
/** Returns an authroizer which just rejects, and
 * proveds the unknown login type url
 * @returns {ReactWebAuthorizer}
 */
const getUknownLoginTypeAuthorizer = () => {
  return new Promise((resolve, reject) => {
    reject(getUnknownLoginTypeLocation());
  });
};


class ReactWebAuthorizer {
  constructor(config) {
    this.config = config;
  }

  getAuthorizer() {
    const authInfo = getLocalAuthInfo();
    if (authInfo === null || !authInfo || !authInfo.type) {
      return getUknownLoginTypeAuthorizer();
    }

    switch (authInfo.type) {
      case 'oidc':
        return new OidcAuthorizer(this.config);
      case 'sso':
        return new SsoAuthorizer(this.config);
      case 'anonymous':
        return new AnonymousAuthorizer(this.config);
      case 'cognito':
        return new CognitoAuthorizer(this.config);
      default:
        // I don't recognize this type of authorizer, so I'm going to make you log in again
        return getUknownLoginTypeAuthorizer();
    }
  }

  doAuthFromCurrentPage() {
    const authorizer = this.getAuthorizer();
    const pageUrl = window.location.href;
    const postAuthPage = getPostAuthPage();
    return authorizer.authorize(pageUrl, pageUrl, postAuthPage)
      .then((redirectUrl) => {
        window.location = redirectUrl;
      }).catch((preAuthUrl) => {
        window.location = preAuthUrl;
      });
  }

  /**
   * According to the contract we should use the redirect, etc, but we
   * can figure it out from the current page
   */
  reauthorize() {
    return this.doAuthFromCurrentPage();
  }

  authorize() {
    const authInfo = getLocalAuthInfo();
    if (authInfo && authInfo.valid && authInfo.token) {
      return new Promise(((resolve) => {
        resolve(authInfo.token);
      }));
    }
    return this.doAuthFromCurrentPage();
  }

  getToken() {
    const authInfo = getLocalAuthInfo();
    if (authInfo) {
      return authInfo.token;
    }
    return undefined;
  }

  getType() {
    return this.getAuthorizer().getType();
  }
}


export default ReactWebAuthorizer;
