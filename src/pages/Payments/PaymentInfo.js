import React, { useState } from 'react';
import _ from 'lodash';
import Button from '@material-ui/core/Button';
import CardInputForm from './CardInputForm';
import StoredCards from './StoredCards';
import { useIntl } from 'react-intl';
import SubSection from '../../containers/SubSection/SubSection';
import { Card } from '@material-ui/core';
import { makeStyles, useTheme } from '@material-ui/styles';

const useStyles = makeStyles((theme) => {
  return {
    addPaymentButton: {
      backgroundColor: '#2D9CDB',
      color: 'white',
      '&:hover': {
        backgroundColor: '#2D9CDB'
      },
      textTransform: 'none',
      marginTop: theme.spacing(1),
    },

  };
});

function PaymentInfo (props) {
  const { subscriptionInfo, setSubscriptionInfo } = props;
  const [addCardVisible, setAddCardVisible] = useState(false);
  const intl = useIntl();
  const theme = useTheme();
  const classes = useStyles(theme);
  const { payment_methods: paymentMethods } = subscriptionInfo || {};
  const addButtonLabel = _.isEmpty(paymentMethods) ? 'paymentInfoButtonAdd' : 'paymentInfoButtonUpdate';

  return (
    <Card>
      <SubSection
        title="Payment Cards"
        padChildren
      >

        <StoredCards billingInfo={paymentMethods}/>
        {!addCardVisible && (
          <Button
            className={classes.addPaymentButton}
            onClick={() => setAddCardVisible(true)}
          >
            {intl.formatMessage({ id: addButtonLabel })}
          </Button>
        )}
        {addCardVisible && (
          <CardInputForm onSubmit={() => setAddCardVisible(false)}
                         onUpdate={(paymentMethod) => setSubscriptionInfo({...subscriptionInfo,
                           payment_methods:[paymentMethod.card]})}
                         onCancel={() => setAddCardVisible(false)}/>
        )}

      </SubSection>
    </Card>
  );
}

export default PaymentInfo;