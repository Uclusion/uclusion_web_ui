import React from 'react';
import PropTypes from 'prop-types';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import JobStageStep from './JobStageStep';
import JobAssignStep from './JobAssignStep';
import CloseCommentsStep from './CloseCommentsStep';

function JobStageWizard(props) {
  const { marketId, investibleId } = props;

  return (
    <WizardStylesProvider>
      <FormdataWizard name={`job_stage_wizard${investibleId}`} useLocalStorage={false}>
        <JobStageStep marketId={marketId} investibleId={investibleId} />
        <CloseCommentsStep marketId={marketId} investibleId={investibleId} />
        <JobAssignStep marketId={marketId} investibleId={investibleId} />
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

JobStageWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

JobStageWizard.defaultProps = {
  onStartOver: () => {},
  onFinish: () => {},
  showCancel: true
}

export default JobStageWizard;

