import React from 'react';
import PropTypes from 'prop-types';
import FormdataWizard from 'react-formdata-wizard';
import DecideResolveStep from './DecideResolveStep';
import { getMessageId } from '../../../contexts/NotificationsContext/notificationsContextHelper';

function ResolveWizard(props) {
  const { marketId, commentId, message } = props;
  const parentElementId =  getMessageId(message);
  return (
    <FormdataWizard name={`resolve_wizard${commentId}`} defaultFormData={{parentElementId, useCompression: true}}>
      <DecideResolveStep marketId={marketId} commentId={commentId} message={message}/>
    </FormdataWizard>
  );
}

ResolveWizard.propTypes = {
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

export default ResolveWizard;

