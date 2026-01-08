import React from 'react';
import PropTypes from 'prop-types';
import FormdataWizard from 'react-formdata-wizard';
import IntroduceGroupStep from './IntroduceGroupStep';
import { getMessageId } from '../../../contexts/NotificationsContext/notificationsContextHelper';

function NewGroupWizard(props) {
  const { message } = props;
  const parentElementId = getMessageId(message);
  return (
    <FormdataWizard name={`new_group_wizard${parentElementId}`} defaultFormData={{parentElementId}}>
      <IntroduceGroupStep message={message} />
    </FormdataWizard>
  );
}

NewGroupWizard.propTypes = {
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

export default NewGroupWizard;

