import React from 'react'
import PropTypes from 'prop-types'
import FormdataWizard from 'react-formdata-wizard';
import DecideAcceptRejectStep from './DecideAcceptRejectStep'
import { getMessageId } from '../../../contexts/NotificationsContext/notificationsContextHelper';

function AcceptRejectWizard(props) {
  const { marketId, commentId, message } = props;
  const parentElementId =  getMessageId(message);
  return (
    <FormdataWizard name={`accept_wizard${commentId}`} defaultFormData={{parentElementId, useCompression: true}}>
      <DecideAcceptRejectStep marketId={marketId} commentId={commentId} message={message}/>
    </FormdataWizard>
  );
}

AcceptRejectWizard.propTypes = {
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

export default AcceptRejectWizard;

