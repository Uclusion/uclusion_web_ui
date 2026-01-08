import React from 'react';
import PropTypes from 'prop-types';
import SignOutWarningStep from './SignOutWarningStep';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';

function SignOutWizard() {
  return (
    <WizardStylesProvider>
      <FormdataWizard name="signout_wizard" useLocalStorage={false}>
        <SignOutWarningStep  />
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

SignOutWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

export default SignOutWizard;

