import React from 'react'
import PropTypes from 'prop-types'
import CreationWizard from '../CreationWizard'
import { useIntl } from 'react-intl'
import InitiativeNameStep from './InitiativeNameStep'
import InitiativeDescriptionStep from './InitiativeDescriptionStep'
import InitiativeExpirationStep from './InitiativeExpirationStep'


function InitiativeWizard(props) {

  const { hidden, onStartOver, isHome, onFinish } = props;

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
  ];

  return (
    <CreationWizard
      hidden={hidden}
      isHome={isHome}
      title={intl.formatMessage({ id: 'DialogWizardTitle' })}
      onFinish={onFinish}
      onStartOver={onStartOver}
      stepPrototypes={stepProtoTypes}
    />
  );

}

InitiativeWizard.propTypes = {
  hidden: PropTypes.bool.isRequired,
  onStartOver: PropTypes.func,
  isHome: PropTypes.bool,
  onFinish: PropTypes.func,
};

InitiativeWizard.defaultProps = {
  onStartOver: () => {},
  isHome: false,
  onFinish: () => {},
};

export default InitiativeWizard;