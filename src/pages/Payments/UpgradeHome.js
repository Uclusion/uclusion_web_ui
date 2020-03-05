import React, { useContext } from 'react';
import { Typography } from '@material-ui/core';
import PropTypes from 'prop-types';
import Screen from '../../containers/Screen/Screen';
import { AccountContext } from '../../contexts/AccountContext/AccountContext';
import UpgradeForm from './UpgradeForm';
import { startSubscription } from '../../api/users';
import { PRODUCT_TIER_FREE, PRODUCT_TIER_STANDARD } from '../../constants/billing';
import { canCreate, getTier, updateAccount } from '../../contexts/AccountContext/accountContextHelper';

function UpgradeHome(props){
  const { hidden } = props;

  const [accountState, accountDispatch] = useContext(AccountContext);

  const tier = getTier(accountState);

  const upgradable = tier === PRODUCT_TIER_FREE;

  function onUpgrade(paymentMethod) {
    const { id: methodId } = paymentMethod;
    // we only support upgrading to standard for now
    return startSubscription(methodId, PRODUCT_TIER_STANDARD)
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
        <UpgradeForm onUpgrade={onUpgrade}/>
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