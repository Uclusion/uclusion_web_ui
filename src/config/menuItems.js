import React from 'react'

import allLocales from './locales'
import { themes } from './themes'
import LanguageIcon from '@material-ui/icons/Language'
import StyleIcon from '@material-ui/icons/Style'
import Brightness2 from '@material-ui/icons/Brightness2'
import Brightness7 from '@material-ui/icons/Brightness7'
import SettingsIcon from '@material-ui/icons/SettingsApplications'
import AccountBoxIcon from '@material-ui/icons/AccountBox'
import LockIcon from '@material-ui/icons/Lock'
import ListIcon from '@material-ui/icons/List'
import DashboardIcon from '@material-ui/icons/Dashboard'

import BusinessIcon from '@material-ui/icons/Business'
import ViewColumn from '@material-ui/icons/ViewColumn'
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
    isAuthMenu,
    handleSignOut,
    marketId
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
      value: '/marketTeams',
      visible: isGranted('read_companies'), //todo make this role based
      primaryText: intl.formatMessage({ id: 'marketTeamsMenu' }),
      leftIcon: <BusinessIcon />
    },
    {
      value: '/' + marketId + '/investibles',
      visible: isAuthorised,
      primaryText: intl.formatMessage({ id: 'investiblesMenu' }),
      leftIcon: <ListIcon />,
    },
    {
      value: '/marketCategories',
      visible: isAuthorised,
      primaryText: intl.formatMessage({ id: 'marketCategoriesMenu'}),
      leftIcon: <ViewColumn/>
    },
    { value: '/' + marketId + '/teams',
      visible: isAuthorised,
      primaryText: intl.formatMessage({id: 'myTeamsMenu'}),
      leftIcon: <GroupIcon/>
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
    }
  ]
}

export default getMenuItems
