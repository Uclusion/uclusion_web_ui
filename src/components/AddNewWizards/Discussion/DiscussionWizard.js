import React from 'react';
import PropTypes from 'prop-types';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import AddOptionStep from './AddOptionStep';
import AddCommentStep from './AddCommentStep';
import ConfigureCommentStep from '../ConfigureCommentStep';

function DiscussionWizard(props) {
  const { marketId, groupId, commentType } = props;

  return (
    <WizardStylesProvider>
      <FormdataWizard name="discussion_wizard">
        <AddCommentStep marketId={marketId} groupId={groupId} useType={commentType}  />
        <AddOptionStep />
        <ConfigureCommentStep useType={commentType} />
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

DiscussionWizard.propTypes = {
  marketId: PropTypes.string.isRequired,
  groupId: PropTypes.string.isRequired,
  commentType: PropTypes.string.isRequired
};
export default DiscussionWizard;

