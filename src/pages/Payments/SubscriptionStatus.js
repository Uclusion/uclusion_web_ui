import React, { useContext } from 'react';
import { Card, makeStyles, Typography } from '@material-ui/core';
import SpinBlockingButton from '../../components/SpinBlocking/SpinBlockingButton';
import {
  SUBSCRIPTION_STATUS_ACTIVE, SUBSCRIPTION_STATUS_CANCELED,
  SUBSCRIPTION_STATUS_FREE, SUBSCRIPTION_STATUS_UNSUBSCRIBED
} from '../../constants/billing';
import {
  getAccount,
  getUnusedFullPromotions,
  updateAccount
} from '../../contexts/AccountContext/accountContextHelper';
import { endSubscription } from '../../api/users';
import { useIntl } from 'react-intl';
import { AccountContext } from '../../contexts/AccountContext/AccountContext';
import SubSection from '../../containers/SubSection/SubSection';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'
import Link from '@material-ui/core/Link';
import _ from 'lodash';


const styleClasses = makeStyles(
  {
    noPayment: {
      color: 'red',
    },
    action: {
      boxShadow: 'none',
      padding: '4px 16px',
      textTransform: 'none',
      '&:hover': {
        boxShadow: 'none'
      }
    },
    actionPrimary: {
      backgroundColor: '#2D9CDB',
      color: 'white',
      '&:hover': {
        backgroundColor: '#2D9CDB'
      }
    },
    subscriptionButton: {
      margin: '16px 0'
    },
    cancelSubscriptionButton: {
      textTransform: 'none',
      backgroundColor: '#E85757',
      color: 'white',
      '&:hover': {
        backgroundColor: '#E85757'
      }
    }
  }, { name: 'change' }
);

function SubscriptionStatus (props) {
  const { subscriptionInfo } = props;
  const intl = useIntl();
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [accountState, accountDispatch] = useContext(AccountContext);
  const account = getAccount(accountState);
  const {
    billing_subscription_status: subStatus,
    invoice_payment_failed: invoicePaymentFailed,
  } = account;
  const { subscription, payment_methods: paymentMethods } = subscriptionInfo;
  const classes = styleClasses();
  // some helpful constants
  const trialEndRaw = subscription?.trial_end;
  const trialEnd = trialEndRaw ? trialEndRaw*1000 : undefined;
  const onFree = subStatus === SUBSCRIPTION_STATUS_FREE;
  const cancellable = subStatus === SUBSCRIPTION_STATUS_ACTIVE;
  const needsPayment = _.isEmpty(getUnusedFullPromotions(accountState)) && !onFree &&
    (_.isEmpty(paymentMethods) || invoicePaymentFailed);
  const tierMessage = intl.formatMessage({ id: 'billingFreeTier' });
  const subMessage = getSubscriptionMessage();

  function cancelSubscription () {
    return endSubscription().then((cancelledAccount) => {
      setOperationRunning(false);
      return updateAccount(accountDispatch, cancelledAccount);
    });
  }
console.debug(`trial end is ${trialEnd}`)
  function getSubscriptionMessage () {
    switch (subStatus) {
      case SUBSCRIPTION_STATUS_ACTIVE:
        if (trialEnd && new Date(trialEnd) > Date.now()) {
          return intl.formatMessage({ id: 'billingSubTrial' }, { date: intl.formatDate(trialEnd) });
        }
        const subscriptionItems = subscription?.items?.data;
        const subscriptionItem = subscriptionItems?.length > 0 ? subscriptionItems[0] : {};
        const subscriptionPrice = subscriptionItem?.price || {};
        const price = `$${subscriptionPrice.unit_amount/100}`;
        return intl.formatMessage({ id: 'billingSubActive' }, { price });
      case SUBSCRIPTION_STATUS_CANCELED:
        return intl.formatMessage({ id: 'billingSubCanceled' });
      case SUBSCRIPTION_STATUS_UNSUBSCRIBED:
        return intl.formatMessage({ id: 'billingSubUnsubscribed' });
      default:
        return intl.formatMessage({ id: 'billingSubFree' });
    }
  }

  return (
    <Card>
      <SubSection
        title="Subscription"
        padChildren
      >
        <Typography>
          See <Link href="https://documentation.uclusion.com/getting-started/login/#billing" target="_blank">billing</Link> for help.
        </Typography>
        <Typography>
          {tierMessage}
        </Typography>
        {!onFree && (
          <Typography style={{marginBottom: '1rem'}}>
            <strong>{subMessage}</strong>
          </Typography>
        )}
        {needsPayment && (
          <Typography className={classes.noPayment} style={{marginBottom: '1rem'}}>
            {intl.formatMessage({ id: 'billingNeedCard' })}
          </Typography>
        )}
        {cancellable && (
          <SpinBlockingButton
            className={classes.cancelSubscriptionButton}
            onClick={cancelSubscription}
            id="billingSubCancel"
          >
            {intl.formatMessage({ id: 'billingSubCancel' })}
          </SpinBlockingButton>
        )}
      </SubSection>
    </Card>
  );
}

export default SubscriptionStatus;