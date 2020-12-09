import React from 'react';

import PropTypes from 'prop-types';
import Screen from '../../containers/Screen/Screen';
import { useIntl } from 'react-intl';
import SubscriptionStatus from './SubscriptionStatus';
import PromoCodeInput from './PromoCodeInput';
import AccountPromos from './AccountPromos';
import PaymentInfo from './PaymentInfo';
import Invoices from './Invoices';

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
      <SubscriptionStatus/>
      <AccountPromos/>
      <PromoCodeInput/>
      <PaymentInfo/>
      <Invoices/>

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