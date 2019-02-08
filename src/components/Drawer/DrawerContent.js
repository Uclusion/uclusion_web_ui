import React from 'react';
import { withTheme } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';
import { withRouter } from 'react-router-dom';
import { withA2HS } from 'a2hs';
import SelectableMenuList from '../../containers/SelectableMenuList';
import withAppConfigs from '../../utils/withAppConfigs';
import { withMarketId } from '../PathProps/MarketId';
import { withUserAndPermissions } from '../UserPermissions/UserPermissions';

export const DrawerContent = (props, context) => {
  const {
    appConfig,
    match,
    drawer,
  } = props;

  const handleChange = (event, index) => {
    const { history, setDrawerMobileOpen } = props;

    if (index !== undefined) {
      setDrawerMobileOpen(false);
    }

    if (index !== undefined && index !== Object(index)) {
      history.push(index);
    }
  };

  const handleSignOut = () => {


  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
    }}
    >
      <SelectableMenuList
        items={appConfig.getMenuItems({ ...props, handleSignOut })}
        onIndexChange={handleChange}
        index={match ? match.path : '/'}
        useMinified={drawer.useMinified && !drawer.open}
      />

    </div>

  );
};

export default injectIntl(withTheme()(withRouter(withAppConfigs(withA2HS(withMarketId(withUserAndPermissions(DrawerContent)))))));
