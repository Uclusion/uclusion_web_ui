import React from 'react';
import PropTypes from 'prop-types';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import ChooseCommentTypeStep from './ChooseCommentTypeStep';
import AddOptionStep from './AddOptionStep';
import AddCommentStep from './AddCommentStep';
import ConfigureCommentStep from '../ConfigureCommentStep';

function DiscussionWizard(props) {
  const { marketId, groupId } = props;

  return (
    <WizardStylesProvider>
      <FormdataWizard name="discussion_wizard">
        <ChooseCommentTypeStep />
        <AddCommentStep marketId={marketId} groupId={groupId}  />
        <AddOptionStep />
        <ConfigureCommentStep />
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

DiscussionWizard.propTypes = {
  marketId: PropTypes.string.isRequired,
  groupId: PropTypes.string.isRequired
};
export default DiscussionWizard;

