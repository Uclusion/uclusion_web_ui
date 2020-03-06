import React, { useContext } from 'react';
import { Typography } from '@material-ui/core';
import PropTypes from 'prop-types';
import Screen from '../../containers/Screen/Screen';
import { AccountContext } from '../../contexts/AccountContext/AccountContext';
import { PRODUCT_TIER_FREE, PRODUCT_TIER_STANDARD } from '../../constants/billing';
import { canCreate, getTier, updateAccount } from '../../contexts/AccountContext/accountContextHelper';
import { startSubscription } from '../../api/users';
import ApiBlockingButton from '../../components/SpinBlocking/ApiBlockingButton';

function UpgradeHome(props){
  const { hidden } = props;

  const [accountState, accountDispatch] = useContext(AccountContext);

  const tier = getTier(accountState);

  const upgradable = tier === PRODUCT_TIER_FREE;


  function beginSubscription() {
    return startSubscription(PRODUCT_TIER_STANDARD)
      .then((upgradedAccount) => {
        updateAccount(accountDispatch, upgradedAccount);
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
    </Screen>
  );
}

UpgradeHome.propTypes = {
  hidden: PropTypes.bool,
};

UpgradeHome.defaultProps = {
  hidden: false,
};
export default UpgradeHome;