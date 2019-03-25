import React from 'react';

// import LanguageIcon from '@material-ui/icons/Language';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
// import StyleIcon from '@material-ui/icons/Style';
// import Brightness2 from '@material-ui/icons/Brightness2';
// import Brightness7 from '@material-ui/icons/Brightness7';
// import SettingsIcon from '@material-ui/icons/SettingsApplications';
import AccountBoxIcon from '@material-ui/icons/AccountBox';
import LockIcon from '@material-ui/icons/Lock';
import ListIcon from '@material-ui/icons/List';
import ViewColumn from '@material-ui/icons/ViewColumn';
import GroupIcon from '@material-ui/icons/Group';
import SecurityIcon from '@material-ui/icons/Security'
// import { themes } from './themes';
// import allLocales from './locales';
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
    userPermissions,
  } = props;

  const { canCategorize } = userPermissions;
  const authInfo = getUclusionLocalStorageItem('auth');

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
      value: formCurrentMarketLink('teams'),
      primaryText: intl.formatMessage({ id: 'myTeamsMenu' }),
      leftIcon: <GroupIcon />,
    },
    {
      value: formCurrentMarketLink('invite'),
      primaryText: intl.formatMessage({ id: 'inviteMenu' }),
      visible: authInfo && authInfo.type === 'cognito',
      leftIcon: <SecurityIcon />,
    },
    {
      divider: true,
    },
    {
      value: formCurrentMarketLink('about'),
      primaryText: intl.formatMessage({ id: 'about' }),
      leftIcon: <InfoOutlinedIcon/>
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
      value: formCurrentMarketLink('Login'),
      onClick: handleSignOut,
      primaryText: intl.formatMessage({ id: 'sign_out' }),
      leftIcon: <LockIcon />,
    },
  ];
};

export default getMenuItems;
