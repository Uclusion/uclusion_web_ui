import React from 'react';
import PropTypes from 'prop-types';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import JobApproverStep from './JobApproverStep';

function JobApproverWizard(props) {
  const { marketId, investibleId } = props;

  return (
    <WizardStylesProvider>
      <FormdataWizard name={`job_approver_wizard${investibleId}`} useLocalStorage={false}>
        <JobApproverStep marketId={marketId} investibleId={investibleId} />
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

JobApproverWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

export default JobApproverWizard;

