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
  if (!authInfo.uclusion_token){
    return { ...authInfo, valid: false };
  }
  const decodedToken = decode(authInfo.uclusion_token);
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
/** Returns an authorizer which just rejects, and
 * proveds the unknown login type url
 * @returns {ReactWebAuthorizer}
 */
const getUknownLoginTypeAuthorizer = () => {
  function UnknownAuthorizer() {
    this.authorize = () => {
      return new Promise((resolve, reject) => {
        reject(getUnknownLoginTypeLocation());
      });
    }
  }
  return new UnknownAuthorizer();
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
    const { config, type } = authInfo;
    // use the auth info stored config if it's available othwerise the one we were made with
    const usedConfig = config || this.config;
    switch (type) {
      case 'oidc':
        return new OidcAuthorizer(usedConfig);
      case 'sso':
        return new SsoAuthorizer(usedConfig);
      case 'anonymous':
        return new AnonymousAuthorizer(usedConfig);
      case 'cognito':
        return new CognitoAuthorizer(usedConfig);
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
      .then((uclusionLogin) => {
        console.log(uclusionLogin);
        return uclusionLogin;
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

  isAuthInfoValid(authInfo){
    return authInfo && authInfo.valid && authInfo.uclusion_token;
  }

  authorize() {
    const authInfo = getLocalAuthInfo();
    if (this.isAuthInfoValid(authInfo)) {
      return new Promise(((resolve) => {
        resolve(authInfo);
      }));
    }
    return this.doAuthFromCurrentPage();
  }

  getToken() {
    const authInfo = getLocalAuthInfo();
    if (this.isAuthInfoValid(authInfo)) {
      return authInfo.uclusion_token;
    }
    return undefined;
  }

  getType() {
    return this.getAuthorizer().getType();
  }
}


export default ReactWebAuthorizer;
