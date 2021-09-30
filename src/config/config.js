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
  maxRichTextEditorSize: 7340032,
  drawer_width: 256,
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
  support_users: [{
    external_id: process.env.REACT_APP_SUPPORT_USER_ID0,
    account_id: process.env.REACT_APP_SUPPORT_ACCOUNT_ID0
  },
    { external_id: process.env.REACT_APP_SUPPORT_USER_ID1, account_id: process.env.REACT_APP_SUPPORT_ACCOUNT_ID1 },
    { external_id: process.env.REACT_APP_SUPPORT_USER_ID2, account_id: process.env.REACT_APP_SUPPORT_ACCOUNT_ID2 },
    { external_id: process.env.REACT_APP_SUPPORT_USER_ID3, account_id: process.env.REACT_APP_SUPPORT_ACCOUNT_ID3 },
    { external_id: process.env.REACT_APP_SUPPORT_USER_ID4, account_id: process.env.REACT_APP_SUPPORT_ACCOUNT_ID4 },
    { external_id: process.env.REACT_APP_SUPPORT_USER_ID5, account_id: process.env.REACT_APP_SUPPORT_ACCOUNT_ID5 },
    { external_id: process.env.REACT_APP_SUPPORT_USER_ID6, account_id: process.env.REACT_APP_SUPPORT_ACCOUNT_ID6 },
    { external_id: process.env.REACT_APP_SUPPORT_USER_ID7, account_id: process.env.REACT_APP_SUPPORT_ACCOUNT_ID7 },
    { external_id: process.env.REACT_APP_SUPPORT_USER_ID8, account_id: process.env.REACT_APP_SUPPORT_ACCOUNT_ID8 },
    { external_id: process.env.REACT_APP_SUPPORT_USER_ID9, account_id: process.env.REACT_APP_SUPPORT_ACCOUNT_ID9 }],
  version: process.env.REACT_APP_VERSION,
  uclusionSupportInfo: {
    email: process.env.REACT_APP_UCLUSION_SUPPORT_EMAIL
  },
  logRocketInstance: process.env.REACT_APP_LOGROCKET_INSTANCE,
  helpMovies: {
    accountSignupHelp: 'https://www.uclusion.com/videos/Onboarding.mp4',
  },
  termsOfUseLink: 'https://app.termly.io/document/terms-of-use-for-saas/02fc002b-2cab-4027-8c49-ed2589077551',
  helpLink: 'https://documentation.uclusion.com',
};

export default config;
