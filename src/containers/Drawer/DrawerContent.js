import React from 'react';

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

export default injectIntl(DrawerContent);
