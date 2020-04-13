import React, { useContext } from 'react';
import { Typography, Card, Grid, makeStyles } from '@material-ui/core';
import clsx from 'clsx'
import PropTypes from 'prop-types';
import Screen from '../../containers/Screen/Screen';
import { AccountContext } from '../../contexts/AccountContext/AccountContext';
import { PRODUCT_TIER_FREE, PRODUCT_TIER_STANDARD, SUBSCRIPTION_STATUS_TRIAL, SUBSCRIPTION_STATUS_ACTIVE,
SUBSCRIPTION_STATUS_CANCELED, SUBSCRIPTION_STATUS_UNSUBSCRIBED} from '../../constants/billing';
import {
  getAccount,
  subscriptionCancellable,
  updateAccount
} from '../../contexts/AccountContext/accountContextHelper';
import { startSubscription, endSubscription, restartSubscription } from '../../api/users';
import CardInputForm from './CardInputForm';
import { useIntl } from 'react-intl';
import SpinBlockingButton from '../../components/SpinBlocking/SpinBlockingButton';
import Invoices from './Invoices';



const styleClasses = makeStyles(
  {
    action: {
      boxShadow: "none",
      padding: "4px 16px",
      textTransform: "none",
      "&:hover": {
        boxShadow: "none"
      }
    },
    actionPrimary: {
      backgroundColor: "#2D9CDB",
      color: "white",
      "&:hover": {
        backgroundColor: "#2D9CDB"
      }
    },
    subscriptionButton: {
      margin: '16px 0'
    }
  }, {name: 'change'}
);

function BillingHome (props) {
  const { hidden } = props;
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
  const cancellable = subscriptionCancellable(accountState);
  const restartable = !cancellable && !upgradable;

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

  function cancelSubscription () {
    return endSubscription()
      .then((cancelledAccount) => {
        return {
          result: cancelledAccount,
          spinChecker: () => Promise.resolve(true)
        };
      });
  }

  function resumeSubscription(paymentResult, formResetter) {
    // console.log('Resume called');
    return restartSubscription(paymentResult.paymentMethod.id)
      .then((restartedAccount) => {
        updateAccount(accountDispatch, restartedAccount);
        formResetter();
      });
  }

  const billingSubmit = restartable? resumeSubscription : undefined;

  function getTierMessageId() {
    switch (tier) {
      case PRODUCT_TIER_FREE:
        return 'billingFreeTier';
      case PRODUCT_TIER_STANDARD:
        return 'billingStandardTier';
      default:
        return 'billingUnknownTier';
    }
  }


  function getSubscriptionMessage() {
    switch (subStatus) {
      case SUBSCRIPTION_STATUS_TRIAL:
        return 'billingSubTrial';
      case SUBSCRIPTION_STATUS_ACTIVE:
        return 'billingSubActive';
      case SUBSCRIPTION_STATUS_CANCELED:
        return 'billingSubCanceled';
      case SUBSCRIPTION_STATUS_UNSUBSCRIBED:
        return 'billingSubUnsubscribed';
      default:
        return 'billingSubUnknown';
    }
  }

  const tierMessage = intl.formatMessage({ id: getTierMessageId()});
  const subMessage = intl.formatMessage({ id: getSubscriptionMessage()});

  return (
    <Screen
      hidden={hidden}
      title="Manage Subscription"
      tabTitle="Manage Subscription"
    >
      <Card style={{padding: '2rem'}}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography style={{marginBottom: '16px'}}>
              {intl.formatMessage({id: 'billingMenuItem'})}
            </Typography>
            <Typography>
              {tierMessage}
            </Typography>
            <Typography>
              <strong>{subMessage}</strong>
            </Typography>
            <Typography>
            <strong>{intl.formatMessage({ id: 'billingSubEnd'})}</strong> {intl.formatDate(subEnd)}
            </Typography>
            <Invoices/>
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
                {intl.formatMessage({ id: 'billingSubBegin'})}
              </SpinBlockingButton>
            )}
            {cancellable && (
              <SpinBlockingButton
                onClick={cancelSubscription}
                onSpinStop={onSpinStop}
                marketId="unused"
                hasSpinChecker
              >
                {intl.formatMessage({ id: 'billingSubCancel'})}
              </SpinBlockingButton>
            )}
          </Grid>
        </Grid>
      </Card>
      <Card style={{padding: '2rem', marginTop:'3rem'}}>
        <Grid container spacing={3}>
          <Grid item xs={4}>
            {<CardInputForm
              submitLabelId={restartable? "upgradeFormRestartLabel" : undefined }
              onSubmit={billingSubmit}
            />}
          </Grid>
        </Grid>
      </Card>
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