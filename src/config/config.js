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
  maxRichTextEditorSize: 7340032,
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
    // poolId: process.env.AWS_POOL_ID,
    // clientId: process.env.AWS_CLIENT_ID,
    poolId: 'us-west-2_NVPcNPhKS',
    clientId: '4knr08iqujrprrkpimqm04dnp',
  },
  version: process.env.REACT_APP_VERSION,
  uclusionSupportInfo: {
    email: process.env.REACT_APP_UCLUSION_SUPPORT_EMAIL
  },
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
