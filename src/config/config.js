import { locales } from './locales'

const config = {
  initial_state: {
    locale: 'en',
  },
  payments: {
    stripeKey: process.env.REACT_APP_STRIPE_PUBLIC_API_KEY,
    enabled: 'true' === process.env.REACT_APP_PAYMENT_ENABLED,
  },
  cognito_domain: process.env.REACT_APP_COGNITO_DOMAIN,
  ui_base_url: process.env.REACT_APP_UI_URL,
  locales,
  webSockets: {
    wsUrl: process.env.REACT_APP_WEBSOCKET_URL,
    reconnectInterval: 2000,
  },
  aws: process.env.REACT_APP_AWS_USER_POOL_ID,
  api_configuration: {
    baseURL: process.env.REACT_APP_UCLUSION_URL,
  },
  file_download_configuration: {
    baseURL: process.env.REACT_APP_FILE_URL,
  },
  add_to_slack_url: process.env.REACT_APP_ADD_TO_SLACK_URL,
  version: process.env.REACT_APP_VERSION,
  uclusionSupportInfo: {
    email: process.env.REACT_APP_UCLUSION_SUPPORT_EMAIL
  },
  logRocketInstance: process.env.REACT_APP_LOGROCKET_INSTANCE,
  termsOfUseLink: 'https://documentation.uclusion.com/terms-of-use',
  helpLink: 'https://documentation.uclusion.com',
};

export default config;
