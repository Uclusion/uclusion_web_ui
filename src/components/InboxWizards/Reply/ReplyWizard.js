import React from 'react';
import PropTypes from 'prop-types';
import FormdataWizard from 'react-formdata-wizard';
import DecideReplyStep from './DecideReplyStep';
import OtherOptionsStep from './OtherOptionsStep';
import { getMessageId } from '../../../contexts/NotificationsContext/notificationsContextHelper';

function ReplyWizard(props) {
  const { marketId, commentId, message } = props;
  const  parentElementId = getMessageId(message);
  return (
    <FormdataWizard name={`reply_wizard${commentId}`} defaultFormData={{parentElementId, useCompression: true}}>
      <DecideReplyStep marketId={marketId} commentId={commentId} message={message}/>
      <OtherOptionsStep marketId={marketId} commentId={commentId} message={message}/>
    </FormdataWizard>
  );
}

ReplyWizard.propTypes = {
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

ReplyWizard.defaultProps = {
  onFinish: () => {},
  showCancel: true
}

export default ReplyWizard;

