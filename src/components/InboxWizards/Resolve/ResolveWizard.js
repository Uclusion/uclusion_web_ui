import React from 'react'
import PropTypes from 'prop-types'
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import DecideResolveStep from './DecideResolveStep'

function ResolveWizard(props) {
  const { marketId, commentId, message } = props;

  return (
    <WizardStylesProvider>
      <FormdataWizard name={`resolve_wizard${commentId}`}>
        <DecideResolveStep marketId={marketId} commentId={commentId} message={message}/>
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

ResolveWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

ResolveWizard.defaultProps = {
  onStartOver: () => {},
  onFinish: () => {},
  showCancel: true
}

export default ResolveWizard;

