import getMenuItems from './menuItems'

import locales from './locales'
import routes from './routes'
import { themes } from './themes'
import grants from './grants'
import ReactWebAuthorizer from '../utils/ReactWebAuthorizer'

const authorizer = new ReactWebAuthorizer(process.env.REACT_APP_UCLUSION_URL)

const config = {
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
  webSockets: {
    wsUrl: process.env.REACT_APP_WEBSOCKET_URL,
    reconnectInterval: 3000
  },
  api_configuration: {
    authorizer: authorizer,
    baseURL: process.env.REACT_APP_UCLUSION_URL
  }
}

export default config
