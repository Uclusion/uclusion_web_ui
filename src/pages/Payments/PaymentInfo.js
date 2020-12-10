import React, { useContext, useState } from 'react';
import _ from 'lodash';
import Button from '@material-ui/core/Button';
import CardInputForm from './CardInputForm';
import { AccountContext } from '../../contexts/AccountContext/AccountContext';
import { getCurrentBillingCardInfo } from '../../contexts/AccountContext/accountContextHelper';
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
      textTransform: 'capitalize',
      marginTop: theme.spacing(1),
      marginBottom: theme.spacing(1),
    },

  };
});

function PaymentInfo (props) {
  const [addCardVisible, setAddCardVisible] = useState(false);
  const intl = useIntl();
  const [accountState] = useContext(AccountContext);
  const billingInfo = getCurrentBillingCardInfo(accountState);
  const theme = useTheme();
  const classes = useStyles(theme);
  const addButtonLabel = _.isEmpty(billingInfo) ? 'paymentInfoButtonAdd' : 'paymentInfoButtonUpdate';

  return (
    <Card>
      <SubSection
        title="Payment Cards"
      >

        <StoredCards billingInfo={billingInfo}/>
        {!addCardVisible && (
          <Button
            className={classes.addPaymentButton}
            onClick={() => setAddCardVisible(true)}
          >
            {intl.formatMessage({ id: addButtonLabel })}
          </Button>
        )}
        {addCardVisible && (
          <CardInputForm onSubmit={() => setAddCardVisible(false)} onCancel={() => setAddCardVisible(false)}/>
        )}

      </SubSection>
    </Card>
  );
}

export default PaymentInfo;