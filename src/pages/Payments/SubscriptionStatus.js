import React, { useContext, useState } from 'react';
import { Card, Grid, makeStyles, Typography } from '@material-ui/core';
import Invoices from './Invoices';
import SpinBlockingButton from '../../components/SpinBlocking/SpinBlockingButton';
import clsx from 'clsx';
import {
  PRODUCT_TIER_FREE,
  PRODUCT_TIER_STANDARD,
  SUBSCRIPTION_STATUS_ACTIVE, SUBSCRIPTION_STATUS_CANCELED,
  SUBSCRIPTION_STATUS_TRIAL, SUBSCRIPTION_STATUS_UNSUBSCRIBED
} from '../../constants/billing';
import { getAccount, subscriptionCancellable, updateAccount } from '../../contexts/AccountContext/accountContextHelper';
import { endSubscription, restartSubscription, startSubscription } from '../../api/users';
import { useIntl } from 'react-intl';
import { AccountContext } from '../../contexts/AccountContext/AccountContext';

const styleClasses = makeStyles(
  {
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
    }
  }, { name: 'change' }
);


function SubscriptionStatus (props) {

  const intl = useIntl();
  const [accountState, accountDispatch] = useContext(AccountContext);
  const account = getAccount(accountState);
  const {
    tier,
    billing_subscription_status: subStatus,
    billing_subscription_end: subEnd
  } = account;
  const classes = styleClasses();
  const upgradable = tier === PRODUCT_TIER_FREE;

  // TODO: this should really depend on if the account state needs it open
  const [paymentInfoVisible, setPaymentInfoVisible] = useState(false);



  const cancellable = canCancelSubscription();
  const restartable = !cancellable && !upgradable;
  const billingSubmit = restartable ? resumeSubscription : undefined;

  const tierMessage = intl.formatMessage({ id: getTierMessageId() });
  const subMessage = getSubscriptionMessage();

  // some helpful constants
  const onFree = tier === PRODUCT_TIER_FREE;
  const onTrial = subStatus === SUBSCRIPTION_STATUS_TRIAL;

  function onSpinStop (account) {
    updateAccount(accountDispatch, account);
  }

  function beginSubscription () {
    return startSubscription(PRODUCT_TIER_STANDARD)
      .then((upgradedAccount) => {
        return {
          result: upgradedAccount,
          spinChecker: () => Promise.resolve(true)
        };
      });
  }

  function canCancelSubscription(){
    // is the subscription itself cancellable?
    const subCancelable = subscriptionCancellable(accountState);
    // are we not on a trial? If we aren't then it's just if the sub is
    if (!onTrial) {
      return subCancelable;
    }
    // if we're on a trial it's only cancelable within 7 days of trial end
    const cancelableDate = new Date();
    cancelableDate.setDate(cancelableDate.getDate() + 7);
    return subEnd <= cancelableDate;
  }

  function cancelSubscription () {
    return endSubscription()
      .then((cancelledAccount) => {
        return {
          result: cancelledAccount,
          spinChecker: () => Promise.resolve(true)
        };
      });
  }

  function resumeSubscription (paymentResult, formResetter) {
    // console.log('Resume called');
    return restartSubscription(paymentResult.paymentMethod.id)
      .then((restartedAccount) => {
        updateAccount(accountDispatch, restartedAccount);
        formResetter();
      });
  }


  function getTierMessageId () {
    switch (tier) {
      case PRODUCT_TIER_FREE:
        return 'billingFreeTier';
      case PRODUCT_TIER_STANDARD:
        return 'billingStandardTier';
      default:
        return 'billingUnknownTier';
    }
  }

  function getSubscriptionMessage () {
    switch (subStatus) {
      case SUBSCRIPTION_STATUS_TRIAL:
        return intl.formatMessage({ id: 'billingSubTrial' }, { date: intl.formatDate(subEnd) });
      case SUBSCRIPTION_STATUS_ACTIVE:
        return intl.formatMessage({ id: 'billingSubActive' });
      case SUBSCRIPTION_STATUS_CANCELED:
        return intl.formatMessage({ id: 'billingSubCanceled' });
      case SUBSCRIPTION_STATUS_UNSUBSCRIBED:
        return intl.formatMessage({ id: 'billingSubUnsubscribed' });
      default:
        return intl.formatMessage({ id: 'billingSubUnknown' });
    }
  }


  return (
    <Card elevation={0} style={{ padding: '2rem' }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography>
            {tierMessage}
          </Typography>
          {!onFree && (
            <React.Fragment>
              <Typography>
                <strong>{subMessage}</strong>
              </Typography>
              {!onTrial && (
                <React.Fragment>
                  <Typography>
                    <strong>{intl.formatMessage({ id: 'billingSubEnd' })}</strong>
                  </Typography>
                  <Invoices/>
                </React.Fragment>
              )}
            </React.Fragment>
          )}
          {upgradable && (
            <SpinBlockingButton
              onClick={beginSubscription}
              onSpinStop={onSpinStop}
              hasSpinChecker
              marketId="unused"
              className={clsx(
                classes.action,
                classes.actionPrimary,
                classes.subscriptionButton
              )}
            >
              {intl.formatMessage({ id: 'billingSubBegin' })}
            </SpinBlockingButton>
          )}
          {cancellable && (
            <SpinBlockingButton
              onClick={cancelSubscription}
              onSpinStop={onSpinStop}
              marketId="unused"
              hasSpinChecker
            >
              {intl.formatMessage({ id: 'billingSubCancel' })}
            </SpinBlockingButton>
          )}
        </Grid>
      </Grid>
    </Card>
  );
}

export default SubscriptionStatus;