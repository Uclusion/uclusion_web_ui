import React from 'react';
import PropTypes from 'prop-types';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import ReplyStep from './ReplyStep';

function ReplyWizard(props) {
  const { marketId, commentId } = props;

  return (
    <WizardStylesProvider>
      <FormdataWizard name={`reply_wizard${commentId}`}>
        <ReplyStep marketId={marketId} commentId={commentId} />
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

ReplyWizard.propTypes = {
  commentId: PropTypes.string.isRequired
};
export default ReplyWizard;

