import React from 'react';
import PropTypes from 'prop-types';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import ChooseCommentTypeStep from './ChooseCommentTypeStep';

function DiscussionWizard(props) {
  const { investibleId } = props;

  return (
    <WizardStylesProvider>
      <FormdataWizard name="discussion_wizard">
        <ChooseCommentTypeStep investibleId={investibleId} />
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

DiscussionWizard.propTypes = {
  investibleId: PropTypes.string.isRequired
};
export default DiscussionWizard;

