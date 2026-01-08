import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import JobDescriptionStatusStep from './JobDescriptionStatusStep';
import FormdataWizard from 'react-formdata-wizard';
import EstimateCompletionStep from './EstimateCompletionStep';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { removeWorkListItem } from '../../../pages/Home/YourWork/WorkListItem';
import { useHistory } from 'react-router';
import OtherOptionsStep from './OtherOptionsStep';
import { getMessageId } from '../../../contexts/NotificationsContext/notificationsContextHelper';

function StatusWizard(props) {
  const { marketId, investibleId, message } = props;
  const [, messagesDispatch] = useContext(NotificationsContext);
  const history = useHistory();
  const parentElementId = getMessageId(message);

  function myOnFinish() {
    removeWorkListItem(message, messagesDispatch, history);
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

