import React, { useContext } from 'react';
import { Card, makeStyles, Typography } from '@material-ui/core';
import SpinBlockingButton from '../../components/SpinBlocking/SpinBlockingButton';
import clsx from 'clsx';
import {
  PRODUCT_TIER_FREE,
  PRODUCT_TIER_STANDARD,
  SUBSCRIPTION_STATUS_ACTIVE, SUBSCRIPTION_STATUS_CANCELED,
  SUBSCRIPTION_STATUS_TRIAL, SUBSCRIPTION_STATUS_UNSUBSCRIBED
} from '../../constants/billing';
import {
  getAccount,
  subscriptionCancellable, subscriptionNeedsPayment,
  updateAccount
} from '../../contexts/AccountContext/accountContextHelper';
import { endSubscription, restartSubscription, startSubscription } from '../../api/users';
import { useIntl } from 'react-intl';
import { AccountContext } from '../../contexts/AccountContext/AccountContext';
import SubSection from '../../containers/SubSection/SubSection';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'


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

  const intl = useIntl();
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [accountState, accountDispatch] = useContext(AccountContext);
  const account = getAccount(accountState);
  const {
    billing_subscription_status: subStatus,
    billing_subscription_end: subEnd,
    billing_subscription_trial_end: trialEnd,
  } = account;
  const tier = [SUBSCRIPTION_STATUS_TRIAL, SUBSCRIPTION_STATUS_ACTIVE].includes(subStatus) ? PRODUCT_TIER_STANDARD
    : PRODUCT_TIER_FREE;
  const classes = styleClasses();
  const upgradable = tier === PRODUCT_TIER_FREE;

  // some helpful constants
  const onFree = tier === PRODUCT_TIER_FREE;
  const onTrial = subStatus === SUBSCRIPTION_STATUS_TRIAL;
  const cancelledBefore = subStatus === SUBSCRIPTION_STATUS_CANCELED;
  const cancellable = canCancelSubscription();
  const resumable = upgradable && cancelledBefore;
  const needsPayment = subscriptionNeedsPayment(accountState);

  const tierMessage = intl.formatMessage({ id: getTierMessageId(tier) });
  const subMessage = getSubscriptionMessage();

  function beginSubscription () {
    return startSubscription().then((upgradedAccount) => {
      setOperationRunning(false);
      return updateAccount(accountDispatch, upgradedAccount);
    });
  }

  function canCancelSubscription () {
    // is the subscription itself cancellable?
    const subCancelable = subscriptionCancellable(accountState);
    // are we not on a trial? If we aren't then it's just if the sub is
    if (!onTrial) {
      return subCancelable;
    }
    // if we're on a trial it's only cancelable within 7 days of trial end
    const cancelableDate = new Date();
    cancelableDate.setDate(cancelableDate.getDate() + 190);
    return subEnd <= cancelableDate;
  }

  function cancelSubscription () {
    return endSubscription().then((cancelledAccount) => {
      setOperationRunning(false);
      return updateAccount(accountDispatch, cancelledAccount);
    });
  }

  function resumeSubscription () {
    return restartSubscription().then((restartedAccount) => {
      setOperationRunning(false);
      return updateAccount(accountDispatch, restartedAccount);
    });
  }

  function getTierMessageId(tier) {
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
        return intl.formatMessage({ id: 'billingSubTrial' }, { date: intl.formatDate(trialEnd) });
      case SUBSCRIPTION_STATUS_ACTIVE:
        return intl.formatMessage({ id: 'billingSubActive' }, { date: intl.formatDate(subEnd) });
      case SUBSCRIPTION_STATUS_CANCELED:
        return intl.formatMessage({ id: 'billingSubCanceled' }, { date: intl.formatDate(subEnd) });
      case SUBSCRIPTION_STATUS_UNSUBSCRIBED:
        return intl.formatMessage({ id: 'billingSubUnsubscribed' });
      default:
        return intl.formatMessage({ id: 'billingSubUnknown' });
    }
  }

  return (
    <Card>
      <SubSection
        title="Subscription"
        helpLink='https://documentation.uclusion.com/getting-started/login/#billing'
        padChildren
      >
        <Typography>
          {tierMessage}
        </Typography>
        {!onFree && (
          <Typography>
            <strong>{subMessage}</strong>
          </Typography>
        )}
        {upgradable && !resumable && (
          <SpinBlockingButton
            onClick={beginSubscription}
            id="billingSubStartTrial"
            className={clsx(
              classes.action,
              classes.actionPrimary,
              classes.subscriptionButton
            )}
          >
            {intl.formatMessage({ id: 'billingSubStartTrial' })}
          </SpinBlockingButton>
        )}
        {resumable && needsPayment && (
          <Typography className={classes.noPayment}>
            {intl.formatMessage({ id: 'billingNeedCard' })}
          </Typography>
        )}
        {resumable && !needsPayment && (
          <SpinBlockingButton
            onClick={resumeSubscription}
            id="billingSubRestart"
            className={clsx(
              classes.action,
              classes.actionPrimary,
              classes.subscriptionButton
            )}
          >
            {intl.formatMessage({ id: 'billingSubRestart' })}
          </SpinBlockingButton>

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