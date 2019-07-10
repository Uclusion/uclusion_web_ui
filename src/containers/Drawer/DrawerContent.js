import React from 'react';
import { connect } from 'react-redux';
import { withTheme } from '@material-ui/core/styles';
import withWidth, { isWidthDown } from '@material-ui/core/withWidth';
import { injectIntl } from 'react-intl';
import { withRouter } from 'react-router-dom';
import { withA2HS } from 'a2hs';
import SelectableMenuList from '../SelectableMenuList';
import { withMarketId } from '../../components/PathProps/MarketId';
import withAppConfigs from '../../utils/withAppConfigs';
import { setUclusionLocalStorageItem } from '../../components/utils';

import { updateLocale } from '../../store/locale/actions';
import { userLogout } from '../../store/auth/actions';
import drawerActions from '../../store/drawer/actions';

const DrawerContent = (props) => {
  const {
    appConfig,
    history,
    match,
    width,
    setDrawerOpen,
  } = props;

  const handleChange = (event, index) => {
    const smDown = isWidthDown('sm', width);
    if (index !== undefined && smDown) {
      setDrawerOpen(false);
    }

    if (index !== undefined && index !== Object(index)) {
      history.push(index);
    }
  };

  const handleSignOut = () => {
    setUclusionLocalStorageItem('auth', null);
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
      />

    </div>

  );
};

export default connect(
  null,
  {
    updateLocale,
    userLogout,
    ...drawerActions,
  },
)(injectIntl(withWidth()(withTheme()(
  withRouter(withAppConfigs(withA2HS(withMarketId(DrawerContent)))),
))));
