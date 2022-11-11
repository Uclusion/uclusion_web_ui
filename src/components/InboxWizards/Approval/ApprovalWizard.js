import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import JobDescriptionApprovalStep from './JobDescriptionApprovalStep'
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import { formInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import ActionApprovalStep from './ActionApprovalStep'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'

function ApprovalWizard(props) {
  const { marketId, investibleId } = props;
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const history = useHistory();

  function myOnFinish() {
    setOperationRunning(false);
    const link = formInvestibleLink(marketId, investibleId);
    navigate(history, link);
  }

  return (
    <WizardStylesProvider>
      <FormdataWizard name="approval_wizard">
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

