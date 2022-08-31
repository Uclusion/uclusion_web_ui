import React from 'react';

import PropTypes from 'prop-types';
import Screen from '../../containers/Screen/Screen';
import { useIntl } from 'react-intl';
import SubscriptionStatus from './SubscriptionStatus';

import AccountPromos from './AccountPromos';
import PaymentInfo from './PaymentInfo';
import Invoices from './Invoices';
import { makeStyles, useTheme } from '@material-ui/styles';


const useStyles = makeStyles((theme) => {
  return {
    billingContainer: {
      maxWidth: '600px',
      display: 'block',
      marginLeft: 'auto',
      marginRight: 'auto',
    },

    sectionContainer: {
      marginTop: theme.spacing(2),
    }
  };

});

function BillingHome (props) {
  const { hidden } = props;
  const intl = useIntl();
  const theme = useTheme();
  const classes = useStyles(theme);

  const title = intl.formatMessage({ id: 'BillingHomeTitle' });

  return (
    <Screen
      hidden={hidden}
      title={title}
      tabTitle={title}
      hideMenu
    >
      <div className={classes.billingContainer}>
        <div className={classes.sectionContainer}>
          <SubscriptionStatus/>
        </div>
        <div className={classes.sectionContainer}>
          <AccountPromos/>
        </div>
        <div className={classes.sectionContainer}>
          <PaymentInfo/>
        </div>
        <div className={classes.sectionContainer}>
          <Invoices/>
        </div>
      </div>
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