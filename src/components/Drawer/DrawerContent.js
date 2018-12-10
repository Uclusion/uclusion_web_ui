import React from 'react'
import { withTheme } from '@material-ui/core/styles'
import withAppConfigs from '../../utils/withAppConfigs'
import SelectableMenuList from '../../containers/SelectableMenuList'
import { injectIntl } from 'react-intl'
import { withRouter } from 'react-router-dom'
import { withA2HS } from 'a2hs'

export const DrawerContent = (props, context) => {
  const {
    appConfig,
    match,
    messaging,
    drawer
  } = props

  const handleChange = (event, index) => {
    const { history, setDrawerMobileOpen } = props

    if (index !== undefined) {
      setDrawerMobileOpen(false)
    }

    if (index !== undefined && index !== Object(index)) {
      history.push(index)
    }
  }

  const handleSignOut = () => {
    return

  }

  const menuItems = appConfig.getMenuItems({ ...props, isAuthMenu: true, handleSignOut })

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column'
    }}>
      <SelectableMenuList
        items={menuItems}
        onIndexChange={handleChange}
        index={match ? match.path : '/'}
        useMinified={drawer.useMinified && !drawer.open}
      />

    </div>

  )
}

export default injectIntl(withTheme()(withRouter(withAppConfigs(withA2HS(DrawerContent)))))
