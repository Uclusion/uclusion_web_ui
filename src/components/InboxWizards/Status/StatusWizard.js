import React from 'react';
import useInboxWizardActions from '../useInboxWizardActions';
import PropTypes from 'prop-types';
import JobDescriptionStatusStep from './JobDescriptionStatusStep';
import FormdataWizard from 'react-formdata-wizard';
import EstimateCompletionStep from './EstimateCompletionStep';
import OtherOptionsStep from './OtherOptionsStep';
import { getMessageId } from '../../../contexts/NotificationsContext/notificationsContextHelper';

function StatusWizard(props) {
  const { marketId, investibleId, message } = props;
  const { clearNotification } = useInboxWizardActions(message);
  const parentElementId = getMessageId(message);

  function myOnFinish() {
    clearNotification();
  }

  return (
    <FormdataWizard name={`status_wizard${investibleId}`} useLocalStorage={false}
                    defaultFormData={{parentElementId, useCompression: true}}>
      <JobDescriptionStatusStep onFinish={myOnFinish} marketId={marketId} investibleId={investibleId}
                                message={message}/>
      <EstimateCompletionStep onFinish={myOnFinish} marketId={marketId} investibleId={investibleId} message={message}/>
      <OtherOptionsStep onFinish={myOnFinish} marketId={marketId} investibleId={investibleId}
                                message={message}/>
    </FormdataWizard>
  );
}

StatusWizard.propTypes = {
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

export default StatusWizard;

