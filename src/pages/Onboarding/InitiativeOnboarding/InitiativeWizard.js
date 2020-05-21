import React from 'react';
import PropTypes from 'prop-types';
import OnboardingWizard from '../OnboardingWizard';
import { useIntl } from 'react-intl';
import InitiativeNameStep from './InitiativeNameStep';
import InitiativeDescriptionStep from './InitiativeDescriptionStep';
import InitiativeExpirationStep from './InitiativeExpirationStep';


function InitiativeWizard(props) {

  const { hidden, onStartOver } = props;

  const intl = useIntl();
  const stepProtoTypes = [
    {
      label: 'InitiativeWizardInitiativeNameStepLabel',
      content: <InitiativeNameStep/>
    },
    {
      label: 'InitiativeWizardInitiativeDescriptionStepLabel',
      content: <InitiativeDescriptionStep />,
    },
    {
      label: 'InitiativeWizardInitiativeExpirationStepLabel',
      content: <InitiativeExpirationStep />,
    }
  ];

  return (
    <OnboardingWizard
      hidden={hidden}
      title={intl.formatMessage({ id: 'DialogWizardTitle' })}
      onStartOver={onStartOver}
      stepPrototypes={stepProtoTypes}
    />
  );

}

InitiativeWizard.propTypes = {
  hidden: PropTypes.bool.isRequired,
  onStartOver: PropTypes.func,
};

InitiativeWizard.defaultProps = {
  onStartOver: () => {},
};

export default InitiativeWizard;