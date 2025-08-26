import React, { Suspense, useState } from 'react';
import Screen from '../../containers/Screen/Screen';
import { useIntl } from 'react-intl';
import SubscriptionStatus from './SubscriptionStatus';
import AccountPromos from './AccountPromos';
import PaymentInfo from './PaymentInfo';
import Invoices from './Invoices';
import { makeStyles, useTheme } from '@material-ui/styles';
import { getSubscriptionInfo } from '../../api/users';
import { loadStripe } from '@stripe/stripe-js';
import config from '../../config';
import { AwaitComponent, useAsyncLoader } from '../../utils/PromiseUtils';

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

function BillingPage(props) {
  const { subscriptionInfo, setSubscriptionInfo, stripe, isInbox } = props;
  const intl = useIntl();
  const theme = useTheme();
  const classes = useStyles(theme);
  const title = intl.formatMessage({ id: 'BillingHomeTitle' });
  const inboxContents = <>
    <div className={classes.sectionContainer}>
      <AccountPromos subscriptionInfo={subscriptionInfo} setSubscriptionInfo={setSubscriptionInfo} />
    </div>
    <div className={classes.sectionContainer}>
      <PaymentInfo subscriptionInfo={subscriptionInfo} setSubscriptionInfo={setSubscriptionInfo} stripe={stripe} />
    </div>
  </>;
  if (isInbox) {
    return inboxContents;
  }
  return(
  <Screen
    hidden={false}
    title={title}
    tabTitle={title}
  >
    <div className={classes.billingContainer}>
      <div className={classes.sectionContainer}>
        <SubscriptionStatus subscriptionInfo={subscriptionInfo}/>
      </div>
      {inboxContents}
      <div className={classes.sectionContainer}>
        <Invoices />
      </div>
    </div>
  </Screen>
  );
}

function BillingHome(props) {
  const { isInbox } = props;
  const intl = useIntl();
  const { loader } = useAsyncLoader(() => getSubscriptionInfo().then((result) => loadStripe(config.payments.stripeKey).then((stripe) => {
    return {myStripe: stripe, mySubscriptionInfo: result};
  })));
  const [subscriptionInfo, setSubscriptionInfo] = useState(undefined);
  const [stripe, setStripe] = useState(undefined);

  const fallBack = <Screen hidden={false} loading loadingMessageId='billingLoadingMessage' title={intl.formatMessage({ id: 'loadingMessage' })}>
                      <div />
                  </Screen>;

  function LoadSubscriptionInfo(loaded) {
    const { myStripe, mySubscriptionInfo } = loaded;
    if (mySubscriptionInfo) {
      setSubscriptionInfo(mySubscriptionInfo);
    }
    if (myStripe) {
      setStripe(myStripe);
    }
    if (subscriptionInfo && stripe) {
      return <BillingPage subscriptionInfo={subscriptionInfo} setSubscriptionInfo={setSubscriptionInfo} stripe={stripe} isInbox={isInbox} />;
    }
    return fallBack;
  }

  return (
    <Suspense fallback={fallBack}>
      <AwaitComponent 
        loader={loader}
        render={LoadSubscriptionInfo}
      />
    </Suspense>
  );
}

export default BillingHome;