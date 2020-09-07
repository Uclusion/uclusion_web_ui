import React from 'react';
import PropTypes from 'prop-types';
import OptionNameStep from './OptionNameStep';
import CreationWizard from '../../CreationWizard';
import OptionDescriptionStep from './OptionDescriptionStep';
import { useIntl } from 'react-intl';

function AddOptionWizard (props) {
  const { hidden, onStartOver, onFinish, hideSteppers, titleKey, isHome } = props;
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
    <CreationWizard
      title={intl.formatMessage({ id: titleKey })}
      hidden={hidden}
      hideSteppers={hideSteppers}
      onFinish={onFinish}
      isHome={isHome}
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
  isHome: PropTypes.bool,
};

AddOptionWizard.defaultProps = {
  onStartOver: () => {},
  titleKey: 'AddOptionWizardTitle',
  onFinish: () => {},
  hideSteppers: false,
  isHome: false,
};

export default AddOptionWizard;