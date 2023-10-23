import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import JobDescriptionStatusStep from './JobDescriptionStatusStep';
import FormdataWizard from 'react-formdata-wizard';
import EstimateCompletionStep from './EstimateCompletionStep';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { removeWorkListItem } from '../../../pages/Home/YourWork/WorkListItem';
import { useHistory } from 'react-router';

function StatusWizard(props) {
  const { marketId, investibleId, message } = props;
  const [, messagesDispatch] = useContext(NotificationsContext);
  const history = useHistory();
  const parentElementId = message.type_object_id;

  function myOnFinish() {
    removeWorkListItem(message, messagesDispatch, history);
  }

  return (
    <FormdataWizard name={`status_wizard1${investibleId}`} defaultFormData={{parentElementId, useCompression: true}}>
      <JobDescriptionStatusStep onFinish={myOnFinish} marketId={marketId} investibleId={investibleId}
                                message={message}/>
      <EstimateCompletionStep onFinish={myOnFinish} marketId={marketId} investibleId={investibleId} message={message}/>
    </FormdataWizard>
  );
}

StatusWizard.propTypes = {
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

StatusWizard.defaultProps = {
  onFinish: () => {},
  showCancel: true
}

export default StatusWizard;

