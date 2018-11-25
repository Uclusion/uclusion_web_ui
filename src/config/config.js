import getMenuItems from './menuItems'
import { getUclusionLocalStorage} from '../components/utils'
import locales from './locales'
import routes from './routes'
import themes from './themes'
import grants from './grants'

function TokenAuthorizer () {

  this.authorize = (resolve, reject) => {
    return new Promise((resolve, reject) => {
      try {
        const data = this.getData();
        resolve(data.auth)
      } catch (ex) {
        reject(ex)
      }
    })
  }
  this.setToken = (token) => {
    try {

    } catch (ex) {
      console.error(ex)
    }
  }

  this.getToken = () => {
    const data = getUclusionLocalStorage();
    return data.auth
  }

  this.reauthorize = (resolve, reject) => {
    return this.authorize(resolve, reject)
  }
}

const authorizer = new TokenAuthorizer()

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
      isNightModeOn: true,
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
    baseURL: 'https://dev.api.uclusion.com/v1',
    authorizer: authorizer
  }
}

export default config
