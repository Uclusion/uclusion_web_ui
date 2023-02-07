import React from 'react';
import PropTypes from 'prop-types';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import ChooseCommentTypeStep from './ChooseCommentTypeStep';
import AddCommentStep from './AddCommentStep';

function BugWizard(props) {
  const { investibleId } = props;

  return (
    <WizardStylesProvider>
      <FormdataWizard name="decision_comment_wizard">
        <ChooseCommentTypeStep investibleId={investibleId} />
        <AddCommentStep investibleId={investibleId} />
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

BugWizard.propTypes = {
  investibleId: PropTypes.string.isRequired
};
export default BugWizard;

