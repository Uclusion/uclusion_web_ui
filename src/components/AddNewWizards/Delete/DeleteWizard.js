import React from 'react';
import PropTypes from 'prop-types';
import DeleteWarningStep from './DeleteWarningStep';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';

function DeleteWizard(props) {
  const { marketId, commentId, isInbox } = props;
  return (
    <WizardStylesProvider>
      <FormdataWizard name="delete_wizard" defaultFormData={{useCompression: true}} useLocalStorage={false}>
        <DeleteWarningStep marketId={marketId} commentId={commentId} isInbox={isInbox} />
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

DeleteWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

DeleteWizard.defaultProps = {
  onStartOver: () => {},
  onFinish: () => {},
  showCancel: true
}

export default DeleteWizard;

