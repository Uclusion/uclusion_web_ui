import React from 'react';
import PropTypes from 'prop-types';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import JobAssignStep from './JobAssignStep';

function JobWizard(props) {
  const { marketId, investibleId } = props;

  return (
    <WizardStylesProvider>
      <FormdataWizard name="job_assignee_wizard">
        <JobAssignStep marketId={marketId} investibleId={investibleId} />
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

JobWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

JobWizard.defaultProps = {
  onStartOver: () => {},
  onFinish: () => {},
  showCancel: true
}

export default JobWizard;

