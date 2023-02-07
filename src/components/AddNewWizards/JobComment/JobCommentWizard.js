import React from 'react';
import PropTypes from 'prop-types';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import AddCommentStep from './AddCommentStep';

function JobCommentWizard(props) {
  const { investibleId } = props;

  return (
    <WizardStylesProvider>
      <FormdataWizard name="job_comment_wizard">
        <AddCommentStep investibleId={investibleId} />
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

JobCommentWizard.propTypes = {
  investibleId: PropTypes.string.isRequired
};
export default JobCommentWizard;

