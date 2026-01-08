import React from 'react';
import PropTypes from 'prop-types';
import FormdataWizard from 'react-formdata-wizard';
import TriageStep from './TriageStep';
import { getMessageId } from '../../../contexts/NotificationsContext/notificationsContextHelper';

function TriageWizard(props) {
  const { marketId, commentId, message } = props;
  const parentElementId =  getMessageId(message);
  return (
    <FormdataWizard name={`triage_wizard${commentId}`} defaultFormData={{parentElementId}}>
      <TriageStep marketId={marketId} commentId={commentId} message={message}/>
    </FormdataWizard>
  );
}

TriageWizard.propTypes = {
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

export default TriageWizard;

