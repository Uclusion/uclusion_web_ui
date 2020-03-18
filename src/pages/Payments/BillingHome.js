import React, { useContext } from 'react';
import { Typography } from '@material-ui/core';
import PropTypes from 'prop-types';
import Screen from '../../containers/Screen/Screen';
import { AccountContext } from '../../contexts/AccountContext/AccountContext';
import { PRODUCT_TIER_FREE, PRODUCT_TIER_STANDARD } from '../../constants/billing';
import {
  canCreate,
  getAccount,
  subscriptionCancellable,
  updateAccount
} from '../../contexts/AccountContext/accountContextHelper';
import { startSubscription, endSubscription, restartSubscription } from '../../api/users';
import CardInputForm from './CardInputForm';
import { useIntl } from 'react-intl';
import SpinBlockingButton from '../../components/SpinBlocking/SpinBlockingButton';
import Invoices from './Invoices';

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
    console.log('Resume called');
    return restartSubscription(paymentResult.paymentMethod.id)
      .then((restartedAccount) => {
        updateAccount(accountDispatch, restartedAccount);
        formResetter();
      });
  }

  const billingSubmit = restartable? resumeSubscription : undefined;

  return (
    <Screen
      hidden={hidden}
      title="Manage Subscription"
    >
      <Typography>
        {tier}
      </Typography>
      <Typography>
        Subscription Type: {subStatus}
      </Typography>
      <Typography>
        Subscription End: {intl.formatDate(subEnd)}
      </Typography>
      <Typography>
        {`Can create ${canCreate(accountState)}`}
      </Typography>
      Need more copy here for billing
      <Invoices/>
      {upgradable && (
        <SpinBlockingButton
          onClick={beginSubscription}
          onSpinStop={onSpinStop}
          hasSpinChecker
        >
          Begin Subscription
        </SpinBlockingButton>
      )}
      {cancellable && (
        <SpinBlockingButton
          onClick={cancelSubscription}
          onSpinStop={onSpinStop}
          hasSpinChecker
        >
          Cancel Subscription
        </SpinBlockingButton>
      )}
      {<CardInputForm
        submitLabelId={restartable? "upgradeFormRestartLabel" : undefined }
        onSubmit={billingSubmit}
      />}
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