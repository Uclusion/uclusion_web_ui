import React from 'react';
import PropTypes from 'prop-types';
import FormdataWizard from 'react-formdata-wizard';
import DecideResponseStep from './DecideResponseStep';
import { getMessageId } from '../../../contexts/NotificationsContext/notificationsContextHelper';

function RespondInOptionWizard(props) {
  const { marketId, commentId, message } = props;
  const  parentElementId = getMessageId(message);
  return (
    <FormdataWizard name={`option_response_wizard${commentId}`} defaultFormData={{parentElementId}}>
      <DecideResponseStep marketId={marketId} commentId={commentId} message={message}/>
    </FormdataWizard>
  );
}

RespondInOptionWizard.propTypes = {
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

export default RespondInOptionWizard;

