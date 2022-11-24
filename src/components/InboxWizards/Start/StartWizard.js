import React from 'react'
import PropTypes from 'prop-types'
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import DecideStartStep from './DecideStartStep'

function StartWizard(props) {
  const { marketId, commentId, message } = props;

  return (
    <WizardStylesProvider>
      <FormdataWizard name={`start_wizard${commentId}`}>
        <DecideStartStep marketId={marketId} commentId={commentId} message={message}/>
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

StartWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

StartWizard.defaultProps = {
  onStartOver: () => {},
  onFinish: () => {},
  showCancel: true
}

export default StartWizard;
