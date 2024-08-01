import React, { Suspense, useState } from 'react';
import PropTypes from 'prop-types';
import Screen from '../../containers/Screen/Screen';
import { useIntl } from 'react-intl';
import SubscriptionStatus from './SubscriptionStatus';
import AccountPromos from './AccountPromos';
import PaymentInfo from './PaymentInfo';
import Invoices from './Invoices';
import { makeStyles, useTheme } from '@material-ui/styles';
import { suspend } from 'suspend-react';
import { getSubscriptionInfo } from '../../api/users';

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
  const [subscriptionInfo, setSubscriptionInfo] = useState(false);
  const title = intl.formatMessage({ id: 'BillingHomeTitle' });
  const page = <Screen
    hidden={hidden}
    title={title}
    tabTitle={title}
  >
    <div className={classes.billingContainer}>
      <div className={classes.sectionContainer}>
        <SubscriptionStatus subscriptionInfo={subscriptionInfo}/>
      </div>
      <div className={classes.sectionContainer}>
        <AccountPromos subscriptionInfo={subscriptionInfo} setSubscriptionInfo={setSubscriptionInfo} />
      </div>
      <div className={classes.sectionContainer}>
        <PaymentInfo subscriptionInfo={subscriptionInfo} setSubscriptionInfo={setSubscriptionInfo} />
      </div>
      <div className={classes.sectionContainer}>
        <Invoices />
      </div>
    </div>
  </Screen>;

  function LoadSubscriptionInfo() {
    suspend(async () => {
      const subscriptionInfo = await getSubscriptionInfo();
      setSubscriptionInfo(subscriptionInfo);
    }, [])
    return page;
  }

  if (subscriptionInfo || hidden) {
    return page;
  }

  return (
    <Suspense fallback={<Screen hidden={false} loading loadingMessageId='billingLoadingMessage'
                                title={intl.formatMessage({ id: 'loadingMessage' })}>
      <div />
    </Screen>}>
      <LoadSubscriptionInfo />
    </Suspense>
  );
}

BillingHome.propTypes = {
  hidden: PropTypes.bool,
};

BillingHome.defaultProps = {
  hidden: false,
};
export default BillingHome;