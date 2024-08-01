import React from 'react';
import _ from 'lodash';
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
  const { subscriptionInfo, setSubscriptionInfo} = props;
  const theme = useTheme();
  const classes = useStyles(theme);
  const { subscription, account } = subscriptionInfo || {};
  const { discounts } = subscription || {};
  const { billing_promotions: promos } = account || {};

  function getExpired(code) {
    const discount = discounts?.find((discount) => discount.promotion_code === code);
    const discountEnd = discount?.end ? discount.end*1000 : undefined;
    return discountEnd && new Date(discountEnd) > Date.now();
  }

  return _.isEmpty(promos) ?
    <Card>
      <SubSection
        padChildren
        title="Promotion Codes"
      >
        <div>
          <Typography>
            You have no promotions active on your account.
          </Typography>
        </div>
        <PromoCodeInput/>
      </SubSection>
    </Card> :
    <Card>
      <SubSection
        title="Promotion Codes"
        padChildren
      >
        <div>
          <Typography>
            You have the following promotions on your account:
          </Typography>
          <div className={classes.promoList}>
            {promos.map((promo) => {
              const { code, months, percent_off, consumed } = promo;
              const expired = getExpired(code);
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
        <PromoCodeInput setSubscriptionInfo={setSubscriptionInfo}/>
      </SubSection>
    </Card>;
}

export default AccountPromos;