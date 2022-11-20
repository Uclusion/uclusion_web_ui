import React from 'react'
import PropTypes from 'prop-types'
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import DecideAcceptRejectStep from './DecideAcceptRejectStep'

function AcceptRejectWizard(props) {
  const { marketId, commentId, message } = props;

  return (
    <WizardStylesProvider>
      <FormdataWizard name={`answer_wizard${commentId}`}>
        <DecideAcceptRejectStep marketId={marketId} commentId={commentId} message={message}/>
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

AcceptRejectWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

AcceptRejectWizard.defaultProps = {
  onStartOver: () => {},
  onFinish: () => {},
  showCancel: true
}

export default AcceptRejectWizard;

