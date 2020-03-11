import React, { useContext } from 'react';
import { Typography } from '@material-ui/core';
import PropTypes from 'prop-types';
import Screen from '../../containers/Screen/Screen';
import { AccountContext } from '../../contexts/AccountContext/AccountContext';
import { PRODUCT_TIER_FREE, PRODUCT_TIER_STANDARD } from '../../constants/billing';
import { canCreate, getAccount, updateAccount } from '../../contexts/AccountContext/accountContextHelper';
import { startSubscription, endSubscription } from '../../api/users';
import ApiBlockingButton from '../../components/SpinBlocking/ApiBlockingButton';
import UpdateBillingForm from './UpdateBillingForm';
import { useIntl } from 'react-intl';

function BillingHome(props){
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

  function beginSubscription() {
    return startSubscription(PRODUCT_TIER_STANDARD)
      .then((upgradedAccount) => {
        updateAccount(accountDispatch, upgradedAccount);
      })
  }

  function cancelSubscription() {
    return endSubscription()
      .then((cancelledAccount) => {
        updateAccount(accountDispatch, cancelledAccount);
      })
  }

  return (
    <Screen
      hidden={hidden}
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
      Need some copy here telling them all the great benefits of upgrading to paid.
      We'll integrate stripe elements, and we have name email et all from our contexts.
      {upgradable && (
        <ApiBlockingButton
          onClick={beginSubscription}
        >
          Begin Subscription
        </ApiBlockingButton>
      )}
      {!upgradable && (
        <ApiBlockingButton
          onClick={cancelSubscription}
        >
          Cancel Subscription
        </ApiBlockingButton>
      )}
      {<UpdateBillingForm/>}
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