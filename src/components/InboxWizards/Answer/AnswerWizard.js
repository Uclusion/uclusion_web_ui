import React from 'react';
import PropTypes from 'prop-types';
import FormdataWizard from 'react-formdata-wizard';
import DecideAnswerStep from './DecideAnswerStep';
import { getMessageId } from '../../../contexts/NotificationsContext/notificationsContextHelper';

function AnswerWizard(props) {
  const { marketId, commentId, message } = props;
  const  parentElementId = getMessageId(message);
  return (
    <FormdataWizard name={`answer_wizard${commentId}`} defaultFormData={{parentElementId, useCompression: true}}>
      <DecideAnswerStep marketId={marketId} commentId={commentId} message={message}/>
    </FormdataWizard>
  );
}

AnswerWizard.propTypes = {
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

AnswerWizard.defaultProps = {
  onFinish: () => {},
  showCancel: true
}

export default AnswerWizard;

