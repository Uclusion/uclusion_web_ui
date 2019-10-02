import React from 'react';
import withWidth from '@material-ui/core/withWidth';
import { injectIntl } from 'react-intl';
import { withRouter } from 'react-router-dom';
import NavItems from './NavItems';
import { withMarketId } from '../../components/PathProps/MarketId';

const DrawerContent = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
  }}
  >
    <NavItems />
  </div>
);

export default injectIntl(withWidth()(withRouter(withMarketId(DrawerContent))));
