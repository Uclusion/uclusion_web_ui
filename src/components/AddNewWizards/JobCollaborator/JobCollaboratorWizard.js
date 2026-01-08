import React from 'react';
import PropTypes from 'prop-types';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import JobCollaboratorStep from './JobCollaboratorStep';

function JobCollaboratorWizard(props) {
  const { marketId, investibleId } = props;

  return (
    <WizardStylesProvider>
      <FormdataWizard name={`job_collaborator_wizard${investibleId}`} useLocalStorage={false}>
        <JobCollaboratorStep marketId={marketId} investibleId={investibleId} />
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

JobCollaboratorWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

export default JobCollaboratorWizard;

