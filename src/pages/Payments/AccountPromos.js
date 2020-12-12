import React, { useContext } from 'react';
import _ from 'lodash';
import { AccountContext } from '../../contexts/AccountContext/AccountContext';
import { getAccount } from '../../contexts/AccountContext/accountContextHelper';
import { Card, Typography } from '@material-ui/core';
import SubSection from '../../containers/SubSection/SubSection';
import PromoCodeInput from './PromoCodeInput';
import { makeStyles, useTheme } from '@material-ui/styles';

const useStyles = makeStyles((theme) => {
  return {
    promoList: {
      marginTop: theme.spacing(1),
      marginBottom: theme.spacing(1),
    }
  };
});

function AccountPromos (props) {

  const theme = useTheme();
  const classes = useStyles(theme);
  const [accountState] = useContext(AccountContext);
  const account = getAccount(accountState);
  const {
    billing_promotions
  } = account;
  const safePromotions = billing_promotions || [];
  if (_.isEmpty(safePromotions)) {
    return (
      <Card>
        <SubSection
          title="Promo Codes"
        >
          <div>
            <Typography>
              You have no promotions active on your account.
            </Typography>
          </div>
          <PromoCodeInput/>
        </SubSection>
      </Card>

    );
  }

  function promoExpiry (promo) {
    const { consumed, application_date, months, usable } = promo;
    if (!consumed) {
      return { expired: false };
    }
    if (!usable) {
      return {expired: true}
    }
    const usedDate = new Date(application_date);
    const expiresDate = new Date(usedDate.setMonth(usedDate.getMonth() + months));
    return { expired: (expiresDate <= Date.now()) };
  }

  return (
    <Card>
      <SubSection
        title="Promotion Codes"
      >
        <div>
          <Typography>
            You have the following promotions active on your account:
          </Typography>
          <div className={classes.promoList}>
            {safePromotions.map((promo) => {
              const { code, months, percent_off, consumed } = promo;
              const expires = promoExpiry(promo);
              const { expired } = expires;
              if (expired) {
                return (
                  <Typography key={code}>
                    {code} - Expired
                  </Typography>
                );
              }
              return (
                <Typography key={code}>
                  {consumed && <>Already Used - </>}{code} for {months} month(s) at {percent_off}% off.
                </Typography>
              );
            })}
          </div>
        </div>
        <PromoCodeInput/>
      </SubSection>
    </Card>
  );

}

export default AccountPromos;