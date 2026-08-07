import React from 'react';
import PropTypes from 'prop-types';
import FormdataWizard from 'react-formdata-wizard';
import HandOffWorkStep from './HandOffWorkStep';
import { getMessageId } from '../../../contexts/NotificationsContext/notificationsContextHelper';

// T-all-2345: the AI reported its find_work is empty; the human hands work over from the inbox
function RequestWorkWizard(props) {
  const { message } = props;
  const parentElementId = getMessageId(message);
  return (
    <FormdataWizard name="request_work_wizard" defaultFormData={{parentElementId}}>
      <HandOffWorkStep message={message} />
    </FormdataWizard>
  );
}

RequestWorkWizard.propTypes = {
  message: PropTypes.object.isRequired
};

export default RequestWorkWizard;
