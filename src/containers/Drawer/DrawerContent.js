import React from 'react';
import withWidth from '@material-ui/core/withWidth';
import { injectIntl } from 'react-intl';
import NavItems from './NavItems';

const DrawerContent = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
  }}
  >
    <NavItems />
  </div>
);

export default injectIntl(withWidth()(DrawerContent));
