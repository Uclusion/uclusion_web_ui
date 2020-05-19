import React from 'react';
import PropTypes from 'prop-types';
import DialogNameStep from './DialogNameStep';
import OnboardingWizard from '../OnboardingWizard';
import { useIntl } from 'react-intl';

function DialogWizard (props) {

  const { hidden, onStartOver } = props;
  const intl = useIntl();


  const stepProtoTypes = [
    {
      label: intl.formatMessage({ id: 'DialogWizardDecisionStepLabel' }),
      content: <DialogNameStep/>,
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

DialogWizard.propTypes = {
  hidden: PropTypes.bool.isRequired,
  onStartOver: PropTypes.func,
};

DialogWizard.defaultProps = {
  onStartOver: () => {},
};

export default DialogWizard;