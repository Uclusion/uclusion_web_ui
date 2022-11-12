import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import JobDescriptionStatusStep from './JobDescriptionStatusStep'
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import { formInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import ActionStatusStep from './ActionStatusStep'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import {
  DEHIGHLIGHT_EVENT,
  DELETE_EVENT,
  MODIFY_NOTIFICATIONS_CHANNEL
} from '../../../contexts/NotificationsContext/notificationsContextMessages'
import { pushMessage } from '../../../utils/MessageBusUtils'

function StatusWizard(props) {
  const { marketId, investibleId, message } = props;
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const history = useHistory();

  function myOnFinish() {
    setOperationRunning(false);
    let event = DEHIGHLIGHT_EVENT;
    if (message.type_object_id.startsWith('UNREAD')) {
      event = DELETE_EVENT;
    }
    pushMessage(MODIFY_NOTIFICATIONS_CHANNEL, { event, messages: [message.id] });
    const link = formInvestibleLink(marketId, investibleId);
    navigate(history, link);
  }

  return (
    <WizardStylesProvider>
      <FormdataWizard name={`status_wizard${investibleId}`}>
        <JobDescriptionStatusStep onFinish={myOnFinish} marketId={marketId} investibleId={investibleId}/>
        <ActionStatusStep onFinish={myOnFinish} marketId={marketId} investibleId={investibleId} message={message}/>
      </FormdataWizard>
    </WizardStylesProvider>
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

