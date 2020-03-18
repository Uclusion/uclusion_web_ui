import { locales } from './locales';

const config = {
  initial_state: {
    locale: 'en',
  },
  globalLockEnabled: process.env.REACT_APP_GLOBAL_OPERATION_LOCK_ENABLED,
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
  support_user_id: process.env.REACT_APP_SUPPORT_USER_ID,
  support_account_id: process.env.REACT_APP_SUPPORT_ACCOUNT_ID,
  version: process.env.REACT_APP_VERSION,
  uclusionSupportInfo: {
    email: process.env.REACT_APP_UCLUSION_SUPPORT_EMAIL
  },
  logRocketInstance: process.env.REACT_APP_LOGROCKET_INSTANCE,
  helpMovies: {
    accountSignupHelp: 'https://www.uclusion.com/help_videos/admins/UclusionAccountSetup.mp4',
    usersInvestiblesIntro: 'https://www.uclusion.com/help_videos/users/UclusionIntroUserInvestibles.mp4',
    adminInvestiblesIntro: 'https://www.uclusion.com/help_videos/admins/UclusionAdminInvestibles.mp4',
    investHelp: 'https://www.uclusion.com/help_videos/users/UclusionUserInvest.mp4',
    teamAddHelp: 'https://www.uclusion.com/help_videos/admins/UclusionAdminTeamManagement.mp4',
    inviteAdminIntro: 'https://www.uclusion.com/help_videos/admins/UclusionAdminTeamManagement.mp4',
    inviteUserIntro: 'https://www.uclusion.com/help_videos/users/UclusionUsersTeamManagement.mp4',
    adminsMarketEditIntro: 'https://www.uclusion.com/help_videos/admins/UclusionIntroAdminMarketEdit.mp4',
    uShareGrantHelp: 'https://www.uclusion.com/help_videos/admins/UclusionAdminTeamMemberships.mp4',
    teamMembershipsAdminIntro: 'https://www.uclusion.com/help_videos/admins/UclusionAdminTeamMemberships.mp4',
    teamMembershipsUserIntro: 'https://www.uclusion.com/help_videos/users/UclusionUsersTeamMemberships.mp4',
    myInvestmentsIntro: 'https://www.uclusion.com/help_videos/users/UclusionUsersMyInvestments.mp4',
    investibleEditHelp: 'https://www.uclusion.com/help_videos/admins/UclusionAdminEditInvestible.mp4',
    investibleEditIntro: 'https://www.uclusion.com/help_videos/admins/UclusionAdminEditInvestible.mp4',
    categoriesIntro: 'https://www.uclusion.com/help_videos/admins/UclusionAdminCategories.mp4',
    subscriptionsHelp: 'https://www.uclusion.com/help_videos/UclusionSubscriptions.mp4',
    usersStagesHelp: 'https://www.uclusion.com/help_videos/users/UclusionUsersStages.mp4',
    adminStagesHelp: 'https://www.uclusion.com/help_videos/admins/UclusionAdminStages.mp4',
  },
  termsOfUseLink: 'https://app.termly.io/document/terms-of-use-for-saas/02fc002b-2cab-4027-8c49-ed2589077551',
};

export default config;
