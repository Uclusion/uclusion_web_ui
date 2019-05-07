import getMenuItems from './menuItems';

import locales from './locales';
import routes from './routes';
import { themes } from './themes';
import grants from './grants';
import ReactWebAuthorizer from '../utils/ReactWebAuthorizer';

const authorizer = new ReactWebAuthorizer(process.env.REACT_APP_UCLUSION_URL);

const config = {
  initial_state: {
    themeSource: {
      isNightModeOn: false,
      source: 'light',
    },
    locale: 'en',
  },
  maxRichTextEditorSize: 400000,
  drawer_width: 256,
  locales,
  themes,
  grants,
  routes,
  getMenuItems,
  webSockets: {
    wsUrl: process.env.REACT_APP_WEBSOCKET_URL,
    reconnectInterval: 2000,
  },
  api_configuration: {
    authorizer,
    baseURL: process.env.REACT_APP_UCLUSION_URL,
  },
  version: process.env.REACT_APP_VERSION,
  uclusionSupportInfo: {
    email: process.env.REACT_APP_UCLUSION_SUPPORT_EMAIL
  }
};

export default config;
