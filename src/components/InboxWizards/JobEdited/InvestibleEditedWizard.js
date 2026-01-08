import React from 'react';
import PropTypes from 'prop-types';
import FormdataWizard from 'react-formdata-wizard';
import ReviewEditStep from './ReviewEditStep';
import { getMessageId } from '../../../contexts/NotificationsContext/notificationsContextHelper';

function InvestibleEditedWizard(props) {
  const { marketId, investibleId, message } = props;
  const parentElementId = getMessageId(message);
  return (
    <FormdataWizard name={`investible_edited_wizard${investibleId}`} defaultFormData={{parentElementId}}>
      <ReviewEditStep marketId={marketId} investibleId={investibleId} message={message} />
    </FormdataWizard>
  );
}

InvestibleEditedWizard.propTypes = {
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

export default InvestibleEditedWizard;

