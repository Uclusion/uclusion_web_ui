import React from 'react';
import PropTypes from 'prop-types';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import JobReviewerStep from './JobReviewerStep';

function JobReviewerWizard(props) {
  const { marketId, investibleId } = props;

  return (
    <WizardStylesProvider>
      <FormdataWizard name="job_reviewer_wizard">
        <JobReviewerStep marketId={marketId} investibleId={investibleId} />
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

JobReviewerWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

JobReviewerWizard.defaultProps = {
  onStartOver: () => {},
  onFinish: () => {},
  showCancel: true
}

export default JobReviewerWizard;

