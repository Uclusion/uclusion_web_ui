import React from 'react'
import PropTypes from 'prop-types'
import OnboardingWizard from '../../OnboardingWizard'
import { useIntl } from 'react-intl'
import InitiativeNameStep from './InitiativeNameStep'
import InitiativeDescriptionStep from './InitiativeDescriptionStep'
import InitiativeExpirationStep from './InitiativeExpirationStep'
import CreatingInitiativeStep from './CreatingInitiativeStep'

function InitiativeWizard(props) {

  const { hidden, onStartOver, isHome } = props;

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
    },
    {
      label: 'InitiativeWizardCreatingInitiativeStepLabel',
      content: <CreatingInitiativeStep />,
    }
  ];

  return (
    <OnboardingWizard
      hidden={hidden}
      isHome={isHome}
      title={intl.formatMessage({ id: 'DialogWizardTitle' })}
      onStartOver={onStartOver}
      stepPrototypes={stepProtoTypes}
    />
  );

}

InitiativeWizard.propTypes = {
  hidden: PropTypes.bool.isRequired,
  onStartOver: PropTypes.func,
  isHome: PropTypes.bool,
};

InitiativeWizard.defaultProps = {
  onStartOver: () => {},
  isHome: false,
};

export default InitiativeWizard;