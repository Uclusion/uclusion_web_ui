import React from 'react';
import PropTypes from 'prop-types';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import ChooseCommentTypeStep from './ChooseCommentTypeStep';
import AddCommentStep from './AddCommentStep';

function DecisionCommentWizard(props) {
  const { investibleId } = props;

  return (
    <WizardStylesProvider>
      <FormdataWizard name={`decision_comment_wizard${investibleId}`}>
        <ChooseCommentTypeStep investibleId={investibleId} />
        <AddCommentStep investibleId={investibleId} />
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

DecisionCommentWizard.propTypes = {
  investibleId: PropTypes.string.isRequired
};
export default DecisionCommentWizard;

