import React  from 'react';

import PropTypes from 'prop-types';
import Screen from '../../containers/Screen/Screen';
import { useIntl } from 'react-intl';

import PromoCodeInput from './PromoCodeInput';
import AccountPromos from './AccountPromos';


function BillingHome (props) {
  const { hidden } = props;
  const intl = useIntl();


  const title = intl.formatMessage({ id: 'BillingHomeTitle' });

  return (
    <Screen
      hidden={hidden}
      title={title}
      tabTitle={title}
    >

      <AccountPromos/>
      <PromoCodeInput/>
    </Screen>
  );
}

BillingHome.propTypes = {
  hidden: PropTypes.bool,
};

BillingHome.defaultProps = {
  hidden: false,
};
export default BillingHome;