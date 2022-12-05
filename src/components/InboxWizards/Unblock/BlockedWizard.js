import React from 'react'
import PropTypes from 'prop-types'
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import DecideUnblockStep from './DecideUnblockStep'

function BlockedWizard(props) {
  const { marketId, commentId, message } = props;

  return (
    <WizardStylesProvider>
      <FormdataWizard name={`unblock_wizard${commentId}`}>
        <DecideUnblockStep marketId={marketId} commentId={commentId} message={message}/>
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

BlockedWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

BlockedWizard.defaultProps = {
  onStartOver: () => {},
  onFinish: () => {},
  showCancel: true
}

export default BlockedWizard;

