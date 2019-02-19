import React from 'react';

import LanguageIcon from '@material-ui/icons/Language';
import StyleIcon from '@material-ui/icons/Style';
import Brightness2 from '@material-ui/icons/Brightness2';
import Brightness7 from '@material-ui/icons/Brightness7';
import SettingsIcon from '@material-ui/icons/SettingsApplications';
import AccountBoxIcon from '@material-ui/icons/AccountBox';
import LockIcon from '@material-ui/icons/Lock';
import ListIcon from '@material-ui/icons/List';
import ViewColumn from '@material-ui/icons/ViewColumn';
import GroupIcon from '@material-ui/icons/Group';
import { themes } from './themes';
import allLocales from './locales';
import { formCurrentMarketLink } from '../utils/marketIdPathFunctions';

const getMenuItems = (props) => {
  const {
    locale,
    updateTheme,
    switchNightMode,
    updateLocale,
    intl,
    themeSource,
    isAuthMenu,
    handleSignOut,
    userPermissions,
  } = props;

  // const isAuthorised = auth.isAuthorised
  const isAuthorised = true;
  const { canCategorize } = userPermissions;

  const themeItems = themes.map(t => ({
    value: undefined,
    visible: true,
    primaryText: intl.formatMessage({ id: t.id }),
    onClick: () => { updateTheme(t.id); },
    leftIcon: <StyleIcon style={{ color: t.color }} />,
  }));

  const localeItems = allLocales.map(l => ({
    value: undefined,
    visible: true,
    primaryText: intl.formatMessage({ id: l.locale }),
    onClick: () => { updateLocale(l.locale); },
    leftIcon: <LanguageIcon />,
  }));

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
      value: formCurrentMarketLink('Login'),
      onClick: handleSignOut,
      primaryText: intl.formatMessage({ id: 'sign_out' }),
      leftIcon: <LockIcon />,
    },
    {
      value: formCurrentMarketLink('investibles'),
      visible: isAuthorised,
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
      divider: true,
      visible: isAuthorised,
    },
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
    {
      onClick: () => { switchNightMode(!themeSource.isNightModeOn); },
      primaryText: intl.formatMessage({ id: themeSource.isNightModeOn ? 'day_mode' : 'night_mode' }),
      leftIcon: themeSource.isNightModeOn ? <Brightness7 /> : <Brightness2 />,
    },
  ];
};

export default getMenuItems;
