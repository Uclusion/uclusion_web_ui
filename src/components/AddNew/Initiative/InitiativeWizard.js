import React from 'react'
import PropTypes from 'prop-types'
import InitiativeNameStep from './InitiativeNameStep'
import InitiativeDescriptionStep from './InitiativeDescriptionStep'
import InitiativeExpirationStep from './InitiativeExpirationStep'
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';


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