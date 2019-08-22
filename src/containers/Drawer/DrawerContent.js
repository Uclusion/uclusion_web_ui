import React from 'react';
import NavItems from './NavItems';
import withWidth, { isWidthDown } from '@material-ui/core/withWidth';
import { injectIntl } from 'react-intl';
import { withRouter } from 'react-router-dom';
import { withMarketId } from '../../components/PathProps/MarketId';



const DrawerContent = (props) => {
  const {
    width,
    history
  } = props;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
    }}
    >
    <NavItems history={history} />
    </div>

  );
};

export default injectIntl(withWidth()(withRouter(withMarketId(DrawerContent))));
