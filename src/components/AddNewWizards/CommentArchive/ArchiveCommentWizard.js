import React from 'react';
import PropTypes from 'prop-types';
import ArchiveWarningStep from './ArchiveWarningStep';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';

function ArchiveCommentWizard(props) {
  const { marketId, commentId, isInbox, typeObjectId } = props;
  return (
    <WizardStylesProvider>
      <FormdataWizard name="archive_comment_wizard" defaultFormData={{useCompression: true}} useLocalStorage={false}>
        <ArchiveWarningStep marketId={marketId} commentId={commentId} isInbox={isInbox && isInbox !== 'false'}
                            typeObjectId={typeObjectId} />
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

ArchiveCommentWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

export default ArchiveCommentWizard;

