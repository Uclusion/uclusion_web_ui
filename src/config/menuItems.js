import React from 'react';

import StarIcon from '@material-ui/icons/Star';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import QuestionAnswerIcon from '@material-ui/icons/QuestionAnswer';
import DashboardIcon from '@material-ui/icons/Dashboard';
import AccountBoxIcon from '@material-ui/icons/AccountBox';
import LockIcon from '@material-ui/icons/Lock';
import ListIcon from '@material-ui/icons/List';
import ViewColumn from '@material-ui/icons/ViewColumn';
import Timeline from '@material-ui/icons/Timeline';
import GroupIcon from '@material-ui/icons/Group';
import SecurityIcon from '@material-ui/icons/Security';
import { formCurrentMarketLink } from '../utils/marketIdPathFunctions';
import { getUclusionLocalStorageItem } from '../components/utils';

const getMenuItems = (props) => {
  const {
//    locale,
//    updateTheme,
//    updateLocale,
    intl,
//    themeSource,
    isAuthMenu,
    handleSignOut,
    upUser,
    userPermissions,
  } = props;

  const { canCategorize, isMarketAdmin, isGuest } = userPermissions;
  const authInfo = getUclusionLocalStorageItem('auth');
  const loginInfo = getUclusionLocalStorageItem('loginInfo');
  const myInvestmentsSubpath = upUser ? 'teams#user:' + upUser.id : '';

/*  const themeItems = themes.map(t => ({
    value: undefined,
    visible: true,
    primaryText: intl.formatMessage({ id: t.id }),
    onClick: () => { updateTheme(t.id); },
    leftIcon: <StyleIcon style={{ color: t.color }} />,
  }));
*/
/*  const localeItems = allLocales.map(l => ({
    value: undefined,
    visible: true,
    primaryText: intl.formatMessage({ id: l.locale }),
    onClick: () => { updateLocale(l.locale); },
    leftIcon: <LanguageIcon />,
  }));
*/
  if (isAuthMenu) {
    return [
      {
        value: '/my_account',
        primaryText: intl.formatMessage({ id: 'my_account' }),
        leftIcon: <AccountBoxIcon />,
      },
    ];
  }


  return [
    {
      value: formCurrentMarketLink('dashboard'),
      primaryText: intl.formatMessage({ id: 'dashboardMenu' }),
      visible: isMarketAdmin,
      leftIcon: <DashboardIcon />,
    },
    {
      value: formCurrentMarketLink('investibles'),
      primaryText: intl.formatMessage({ id: 'investiblesMenu' }),
      leftIcon: <ListIcon />,
    },
    {
      value: formCurrentMarketLink('marketCategories'),
      visible: canCategorize,
      primaryText: intl.formatMessage({ id: 'marketCategoriesMenu' }),
      leftIcon: <ViewColumn />,
    },
    {
      value: formCurrentMarketLink(myInvestmentsSubpath),
      visible: upUser && userPermissions.canInvest,
      primaryText: intl.formatMessage({ id: 'myInvestmentsMenu' }),
      leftIcon: <Timeline />,
    },
    {
      value: formCurrentMarketLink('teams'),
      primaryText: intl.formatMessage({ id: 'myTeamsMenu' }),
      visible: !isGuest,
      leftIcon: <GroupIcon />,
      nestedItems: [
        {
          value: formCurrentMarketLink('invite'),
          primaryText: intl.formatMessage({ id: 'inviteMenu' }),
          visible: (loginInfo && loginInfo.allow_cognito) && ((!isGuest && authInfo && authInfo.type === 'cognito') || isMarketAdmin),
          leftIcon: <SecurityIcon />,
        },
      ],
    },
    {
      divider: true,
    },
    {
      value: formCurrentMarketLink('about'),
      primaryText: intl.formatMessage({ id: 'about' }),
      leftIcon: <InfoOutlinedIcon />,
    },
  /*
  {
      primaryText: intl.formatMessage({ id: 'settings' }),
      primaryTogglesNestedList: true,
      leftIcon: <SettingsIcon />,
      nestedItems: [
        {
          primaryText: intl.formatMessage({ id: 'theme' }),
          secondaryText: intl.formatMessage({ id: themeSource.source }),
          primaryTogglesNestedList: true,
          leftIcon: <StyleIcon />,
          nestedItems: themeItems,
        },
        {
          primaryText: intl.formatMessage({ id: 'language' }),
          secondaryText: intl.formatMessage({ id: locale }),
          primaryTogglesNestedList: true,
          leftIcon: <LanguageIcon />,
          nestedItems: localeItems,
        },
      ],
    },
    */
    {
      primaryText: intl.formatMessage({ id: 'help' }),
      onClick: () => {
        const win = window.open('https://uclusion.zendesk.com/hc/en-us', '_blank');
        win.focus();
      },
      leftIcon: <QuestionAnswerIcon />,
    },
    {
      primaryText: intl.formatMessage({ id: 'uclusionPlanningMarket' }),
      onClick: () => {
        const win = window.open('https://stage.uclusion.com/016c5dd4-e254-4340-8cbd-e3157d9499ca/investibles', '_blank');
        win.focus();
      },
      visible: isMarketAdmin,
      leftIcon: <StarIcon />,
    },
    {
      value: formCurrentMarketLink('Login'),
      onClick: handleSignOut,
      primaryText: intl.formatMessage({ id: 'sign_out' }),
      leftIcon: <LockIcon />,
    },
  ];
};

export default getMenuItems;
