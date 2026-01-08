import React from 'react';
import PropTypes from 'prop-types';
import FormdataWizard from 'react-formdata-wizard';
import DecideUnblockStep from './DecideUnblockStep';
import { getMessageId } from '../../../contexts/NotificationsContext/notificationsContextHelper';

function BlockedWizard(props) {
  const { marketId, commentId, message } = props;
  const parentElementId =  getMessageId(message);
  return (
    <FormdataWizard name={`unblock_wizard${commentId}`} defaultFormData={{parentElementId, useCompression: true}}>
      <DecideUnblockStep marketId={marketId} commentId={commentId} message={message}/>
    </FormdataWizard>
  );
}

BlockedWizard.propTypes = {
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

export default BlockedWizard;

