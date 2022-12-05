import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import JobDescriptionStatusStep from './JobDescriptionStatusStep'
import FormdataWizard from 'react-formdata-wizard'
import { useHistory } from 'react-router'
import ActionStatusStep from './ActionStatusStep'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { wizardFinish } from '../InboxWizardUtils'

function StatusWizard(props) {
  const { marketId, investibleId, message } = props;
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const history = useHistory();

  function myOnFinish(formData) {
    wizardFinish(formData, setOperationRunning, message, history, marketId, investibleId);
  }

  return (
    <FormdataWizard name={`status_wizard${investibleId}`}>
      <JobDescriptionStatusStep onFinish={myOnFinish} marketId={marketId} investibleId={investibleId}/>
      <ActionStatusStep onFinish={myOnFinish} marketId={marketId} investibleId={investibleId} message={message}/>
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

