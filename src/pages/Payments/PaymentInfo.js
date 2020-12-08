import React, { useContext, useState } from 'react';
import _ from 'lodash';
import Button from '@material-ui/core/Button';
import CardInputForm from './CardInputForm';
import { AccountContext } from '../../contexts/AccountContext/AccountContext';
import { getCurrentBillingCardInfo } from '../../contexts/AccountContext/accountContextHelper';
import StoredCards from './StoredCards';
import { useIntl } from 'react-intl';

function PaymentInfo (props) {
  const [addCardVisible, setAddCardVisible] = useState(false);
  const intl = useIntl();
  const [accountState] = useContext(AccountContext);
  const billingInfo = getCurrentBillingCardInfo(accountState);

  const addButtonLabel = _.isEmpty(billingInfo) ? 'paymentInfoButtonAdd' : 'paymentInfoButtonUpdate';

  return (
    <div>
      <StoredCards billingInfo={billingInfo}/>
      <Button
        onClick={() => setAddCardVisible(true)}
      >
        {intl.formatMessage({ id: addButtonLabel })}
      </Button>
      {addCardVisible && (
        <CardInputForm onCancel={() => setAddCardVisible(false)}/>
      )}
    </div>);
}

export default PaymentInfo;