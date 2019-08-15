import React from 'react';
import MarketSelect from './MarketSelect';
import withWidth, { isWidthDown } from '@material-ui/core/withWidth';
import { injectIntl } from 'react-intl';
import { withRouter } from 'react-router-dom';
import { withMarketId } from '../../components/PathProps/MarketId';



const DrawerContent = (props) => {
  const {
    width,
    markets,
  } = props;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
    }}
    >
      <MarketSelect markets={markets} />
    </div>

  );
};

export default injectIntl(withWidth()(withRouter(withMarketId(DrawerContent))));
