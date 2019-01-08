import getMenuItems from './menuItems'
import { getUclusionLocalStorageItem } from '../components/utils'
import locales from './locales'
import routes from './routes'
import { themes } from './themes'
import grants from './grants'
import { OidcAuthorizer, SsoAuthorizer } from 'uclusion_authorizer_sdk'

const UCLUSION_URL = 'https://dev.api.uclusion.com/v1';

class ReactWebAuthorizer {

  getLocalAuthInfo() {
    return getUclusionLocalStorageItem('auth')
  }

  getMarketIdFromUrl () {
    const path = window.location.pathname
    const noSlash = path.substr(1)
    const end = noSlash.indexOf(noSlash)
    const marketId = noSlash.substr(0, end)
    return marketId
  }

  /**
   * Used when I don't know anything about you (e.g. I have no authorization context)
   * @param marketId
   */
  doGenericAuthRedirect(marketId){
    const location =  '/' + marketId + '/Login'
    console.log('redirecting you to login at '  + location)
    window.location = location
  }

  getAuthorizer () {
    const marketId = this.getMarketIdFromUrl()
    const authInfo = this.getLocalAuthInfo()
    if(!authInfo || !authInfo.type){
      this.doGenericAuthRedirect(marketId)
    }
    let authorizer = null
    const pageUrl = window.location.href
    const config = { pageUrl, uclusionUrl: UCLUSION_URL, marketId }
    switch (this.type) {
      case 'oidc':
        authorizer = new OidcAuthorizer(config)
        break
      case 'sso':
        authorizer = new SsoAuthorizer(config)
        break
      default:
        //I don't regonize this type of authorizor, so I'm going to make you log in again
        this.doGenericAuthRedirect(marketId)
      }
    return authorizer
  }

  authorize () {
    const authInfo = this.getLocalAuthInfo()
    if (authInfo && authInfo.token) {
      return new Promise(function (resolve, reject) {
        resolve(authInfo.token)
      })
    }
    ///we're not pre-authorized, so kick them into authorization flow
    const authorizer = this.getAuthorizer()
    const pageUrl = window.location.href
    const redirectUrl = authorizer.authorize(pageUrl, pageUrl)
    window.location = redirectUrl
  }

  getToken () {
    const authInfo = this.getLocalAuthInfo()
    if(authInfo){
      return authInfo.token
    }
    return undefined
  }
}


const authorizer = new ReactWebAuthorizer()

const config = {
  firebase_config: {
    apiKey: 'AIzaSyBQAmNJ2DbRyw8PqdmNWlePYtMP0hUcjpY',
    authDomain: 'react-most-wanted-3b1b2.firebaseapp.com',
    databaseURL: 'https://react-most-wanted-3b1b2.firebaseio.com',
    projectId: 'react-most-wanted-3b1b2',
    storageBucket: 'react-most-wanted-3b1b2.appspot.com',
    messagingSenderId: '258373383650'
  },
  firebase_config_dev: {
    apiKey: 'AIzaSyB31cMH9nJnERC1WCWA7lQHnY08voLs-Z0',
    authDomain: 'react-most-wanted-dev.firebaseapp.com',
    databaseURL: 'https://react-most-wanted-dev.firebaseio.com',
    projectId: 'react-most-wanted-dev',
    storageBucket: 'react-most-wanted-dev.appspot.com',
    messagingSenderId: '70650394824'
  },
  firebase_providers: [
    'google.com',
    'facebook.com',
    'twitter.com',
    'github.com',
    'password',
    'phone'
  ],
  initial_state: {
    themeSource: {
      isNightModeOn: false,
      source: 'light'
    },
    locale: 'en'
  },
  drawer_width: 256,
  locales,
  themes,
  grants,
  routes,
  getMenuItems,
  firebaseLoad: () => import('./firebase'),
  api_configuration: {
    authorizer: authorizer,
    baseURL: UCLUSION_URL
  }
}

export default config
