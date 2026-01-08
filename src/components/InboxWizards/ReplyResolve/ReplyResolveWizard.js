import React from 'react';
import PropTypes from 'prop-types';
import FormdataWizard from 'react-formdata-wizard';
import DecideResponseStep from './DecideResponseStep';
import { getMessageId } from '../../../contexts/NotificationsContext/notificationsContextHelper';

function ReplyResolveWizard(props) {
  const { marketId, commentId, message } = props;
  const parentElementId =  getMessageId(message);
  return (
    <FormdataWizard name={`reply_resolve_wizard${commentId}`} defaultFormData={{parentElementId, useCompression: true}}>
      <DecideResponseStep marketId={marketId} commentId={commentId} message={message}/>
    </FormdataWizard>
  );
}

ReplyResolveWizard.propTypes = {
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

export default ReplyResolveWizard;

