import React from 'react';
import PropTypes from 'prop-types';
import FormdataWizard from 'react-formdata-wizard';
import EstimateChangeViewStep from './EstimateChangeViewStep';
import { getMessageId } from '../../../contexts/NotificationsContext/notificationsContextHelper';

function EstimateChangeWizard(props) {
  const { marketId, investibleId, message } = props;
  const parentElementId = getMessageId(message);

  return (
    <FormdataWizard name={`estimate_change_wizard${investibleId}`} defaultFormData={{parentElementId}}>
      <EstimateChangeViewStep marketId={marketId} investibleId={investibleId} message={message}/>
    </FormdataWizard>
  );
}

EstimateChangeWizard.propTypes = {
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

export default EstimateChangeWizard;

