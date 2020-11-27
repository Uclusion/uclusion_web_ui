import React from 'react'
import PropTypes from 'prop-types'
import InitiativeNameStep from './InitiativeNameStep'
import InitiativeDescriptionStep from './InitiativeDescriptionStep'
import InitiativeExpirationStep from './InitiativeExpirationStep'
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import InitiativeRestrictStep from './InitiativeRestrictStep'


function InitiativeWizard(props) {

  const { onStartOver, onFinish } = props;

  return (
    <WizardStylesProvider>
      <FormdataWizard name="initiative_wizard"
                      onFinish={onFinish}
                      onStartOver={onStartOver}
      >
        <InitiativeNameStep/>
        <InitiativeDescriptionStep />
        <InitiativeExpirationStep />
        <InitiativeRestrictStep />
      </FormdataWizard>
    </WizardStylesProvider>
  );

}

InitiativeWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
};

InitiativeWizard.defaultProps = {
  onStartOver: () => {},
  onFinish: () => {},
};

export default InitiativeWizard;