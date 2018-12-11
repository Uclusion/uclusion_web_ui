import React from 'react'

import allLocales from './locales'
import { themes } from './themes'
import LanguageIcon from '@material-ui/icons/Language'
import StyleIcon from '@material-ui/icons/Style'
import Brightness2 from '@material-ui/icons/Brightness2'
import Brightness7 from '@material-ui/icons/Brightness7'
import SettingsIcon from '@material-ui/icons/SettingsApplications'
import VerticalAlignBottomIcon from '@material-ui/icons/VerticalAlignBottom'
import AccountBoxIcon from '@material-ui/icons/AccountBox'
import LockIcon from '@material-ui/icons/Lock'
import ListIcon from '@material-ui/icons/List'
import DashboardIcon from '@material-ui/icons/Dashboard'

import BusinessIcon from '@material-ui/icons/Business'
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined'
import SecurityIcon from '@material-ui/icons/Security'
import GroupIcon from '@material-ui/icons/Group'


const getMenuItems = (props) => {
  const {
    locale,
    updateTheme,
    switchNightMode,
    updateLocale,
    intl,
    themeSource,
    // auth,
    isGranted,
    deferredPrompt,
    isAppInstallable,
    isAppInstalled,
    isAuthMenu,
    handleSignOut
  } = props

  // const isAuthorised = auth.isAuthorised
  const isAuthorised = true

  const themeItems = themes.map((t) => {
    return {
      value: undefined,
      visible: true,
      primaryText: intl.formatMessage({ id: t.id }),
      onClick: () => { updateTheme(t.id) },
      leftIcon: <StyleIcon style={{ color: t.color }} />
    }
  })

  const localeItems = allLocales.map((l) => {
    return {
      value: undefined,
      visible: true,
      primaryText: intl.formatMessage({ id: l.locale }),
      onClick: () => { updateLocale(l.locale) },
      leftIcon: <LanguageIcon />
    }
  })

  if (isAuthMenu) {
    return [
      {
        value: '/my_account',
        primaryText: intl.formatMessage({ id: 'my_account' }),
        leftIcon: <AccountBoxIcon />
      },
      {
        value: '/signin',
        onClick: handleSignOut,
        primaryText: intl.formatMessage({ id: 'sign_out' }),
        leftIcon: <LockIcon />
      }
    ]
  }

  return [
    {
      value: '/dashboard',
      visible: isAuthorised,
      primaryText: intl.formatMessage({ id: 'dashboard' }),
      leftIcon: <DashboardIcon />
    },
    {
      value: '/customer_teams',
      visible: isGranted('read_companies'), //todo make this role based
      primaryText: intl.formatMessage({ id: 'customerTeamsMenu' }),
      leftIcon: <BusinessIcon />
    },
    {
      value: '/investibles',
      visible: isAuthorised,
      primaryText: intl.formatMessage({ id: 'investibles' }),
      leftIcon: <ListIcon />,
    },
    { value: '/teams',
      visible: isAuthorised,
      primaryText: intl.formatMessage({id: 'myTeamsMenu'}),
      leftIcon: <GroupIcon/>
    },
    { //value: '/profile',
      visible: isAuthorised,
      primaryText: intl.formatMessage({id: 'profileMenu'}),
      leftIcon: <AccountBoxIcon/>,
    },
    {
      value: '/about',
      visible: isAuthorised,
      primaryText: intl.formatMessage({ id: 'about' }),
      leftIcon: <InfoOutlinedIcon />
    },
    {
      visible: isAuthorised, // In prod: isGranted('administration'),
      primaryTogglesNestedList: true,
      primaryText: intl.formatMessage({ id: 'administration' }),
      leftIcon: <SecurityIcon />,
      nestedItems: [
        {
          value: '/users',
          visible: isAuthorised, // In prod: isGranted('read_users'),
          primaryText: intl.formatMessage({ id: 'users' }),
          leftIcon: <GroupIcon />
        },
        {
          value: '/roles',
          visible: isGranted('read_roles'),
          primaryText: intl.formatMessage({ id: 'roles' }),
          leftIcon: <AccountBoxIcon />
        }
      ]
    },
    {
      divider: true,
      visible: isAuthorised
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
          nestedItems: themeItems
        },
        {
          primaryText: intl.formatMessage({ id: 'language' }),
          secondaryText: intl.formatMessage({ id: locale }),
          primaryTogglesNestedList: true,
          leftIcon: <LanguageIcon />,
          nestedItems: localeItems
        }
      ]
    },
    {
      onClick: () => { switchNightMode(!themeSource.isNightModeOn) },
      primaryText: intl.formatMessage({ id: themeSource.isNightModeOn ? 'day_mode' : 'night_mode' }),
      leftIcon: themeSource.isNightModeOn ? <Brightness7 /> : <Brightness2 />
    },
    {
      visible: isAppInstallable && !isAppInstalled,
      onClick: () => { deferredPrompt.prompt() },
      primaryText: intl.formatMessage({ id: 'install' }),
      leftIcon: <VerticalAlignBottomIcon />
    }
  ]
}

export default getMenuItems
