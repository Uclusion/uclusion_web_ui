import React from 'react';
import PropTypes from 'prop-types';
import OptionNameStep from './OptionNameStep';
import OnboardingWizard from '../../../OnboardingWizard';
import OptionDescriptionStep from './OptionDescriptionStep';
import { useIntl } from 'react-intl';

function AddOptionWizard (props) {
  const { hidden, onStartOver, onFinish, hideSteppers, titleKey } = props;
  const intl = useIntl();
  const stepPrototypes = [
    {
      label: 'AddOptionWizardOptionNameStepLabel',
      content: <OptionNameStep/>,
    },
    {
      label: 'AddOptionWizardOptionDescriptionStepLabel',
      content: <OptionDescriptionStep/>,
    }
  ]

  return (
    <OnboardingWizard
      title={intl.formatMessage({ id: titleKey })}
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