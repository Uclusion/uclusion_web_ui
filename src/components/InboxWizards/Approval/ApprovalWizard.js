import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import JobDescriptionApprovalStep from './JobDescriptionApprovalStep'
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import { useHistory } from 'react-router'
import ActionApprovalStep from './ActionApprovalStep'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { wizardFinish } from '../InboxWizardUtils'

function ApprovalWizard(props) {
  const { marketId, investibleId, message } = props;
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const history = useHistory();

  function myOnFinish(formData) {
    wizardFinish(formData, setOperationRunning, message, marketId, investibleId, history);
  }

  return (
    <WizardStylesProvider>
      <FormdataWizard name={`approval_wizard${investibleId}`}>
        <JobDescriptionApprovalStep onFinish={myOnFinish} marketId={marketId} investibleId={investibleId}/>
        <ActionApprovalStep onFinish={myOnFinish} marketId={marketId} investibleId={investibleId}/>
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

ApprovalWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

ApprovalWizard.defaultProps = {
  onStartOver: () => {},
  onFinish: () => {},
  showCancel: true
}

export default ApprovalWizard;
