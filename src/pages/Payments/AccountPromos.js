import React, { useContext } from 'react';
import _ from 'lodash';
import { AccountContext } from '../../contexts/AccountContext/AccountContext';
import { getAccount } from '../../contexts/AccountContext/accountContextHelper';
import { Typography } from '@material-ui/core';

function AccountPromos (props) {

  const [accountState] = useContext(AccountContext);
  const account = getAccount(accountState);
  const {
    billing_promotions
  } = account;
  const safePromotions = billing_promotions || [];
  if (_.isEmpty(safePromotions)) {
    return (
      <Typography>
        You have no promotions active on your account.
      </Typography>
    );
  }

  return (
    <div>
      <Typography>
        You have the following promotions active on your account:
      </Typography>
      {safePromotions.each((promo) => {
        const { code, months, percent_off } = promo;
        return (
          <Typography>
            {code} for {months} month(s) at {percent_off}% off.
          </Typography>
        );
      })}
    </div>
  );

}

export default AccountPromos;