import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import JobDescriptionStatusStep from './JobDescriptionStatusStep';
import FormdataWizard from 'react-formdata-wizard';
import EstimateCompletionStep from './EstimateCompletionStep';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { expandOrContract } from '../../../pages/Home/YourWork/InboxContext';
import { removeWorkListItem, workListStyles } from '../../../pages/Home/YourWork/WorkListItem';

function StatusWizard(props) {
  const { marketId, investibleId, message, inboxDispatch } = props;
  const [, messagesDispatch] = useContext(NotificationsContext);
  const workItemClasses = workListStyles();
  const parentElementId = message.type_object_id;

  function myOnFinish() {
    removeWorkListItem(message, workItemClasses.removed, messagesDispatch);
  }

  return (
    <FormdataWizard name={`status_wizard${investibleId}`}
                    onStartOver={() => inboxDispatch(expandOrContract(parentElementId))}
                    defaultFormData={{parentElementId}}>
      <JobDescriptionStatusStep onFinish={myOnFinish} marketId={marketId} investibleId={investibleId}
                                message={message}/>
      <EstimateCompletionStep onFinish={myOnFinish} marketId={marketId} investibleId={investibleId} message={message}/>
    </FormdataWizard>
  );
}

StatusWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

StatusWizard.defaultProps = {
  onStartOver: () => {},
  onFinish: () => {},
  showCancel: true
}

export default StatusWizard;

