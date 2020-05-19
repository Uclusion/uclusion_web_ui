import React from 'react';
import PropTypes from 'prop-types';
import OptionNameStep from './OptionNameStep';
import OnboardingWizard from '../../OnboardingWizard';

function AddOptionWizard (props) {
  const { hidden, onStartOver, onFinish, hideSteppers } = props;

  const stepPrototypes = [
    {
      label: 'AddOptionWizardOptionNameStepLabel',
      content: <OptionNameStep/>,
    }
  ]

  return (
    <OnboardingWizard
      hidden={hidden}
      hideSteppers={hideSteppers}
      onFinish={onFinish}
      onStartOver={onStartOver}
      stepPrototypes={stepPrototypes}
    />
  );

}

AddOptionWizard.propTypes = {
  hidden: PropTypes.bool.isRequired,
  hideSteppers: PropTypes.bool,
  titleKey: PropTypes.string,
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
};

AddOptionWizard.defaultProps = {
  onStartOver: () => {},
  titleKey: 'AddOptionWizardTitle',
  onFinish: () => {},
  hideSteppers: false,
};

export default AddOptionWizard;