import getMenuItems from './menuItems'

import locales from './locales'
import routes from './routes'
import { themes } from './themes'
import grants from './grants'
import ReactWebAuthorizer from '../utils/ReactWebAuthorizer'

const authorizer = new ReactWebAuthorizer(process.env.REACT_APP_UCLUSION_URL)

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
    baseURL: process.env.REACT_APP_UCLUSION_URL
  }
}

export default config
