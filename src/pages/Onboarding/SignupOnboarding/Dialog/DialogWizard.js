import React from 'react';
import PropTypes from 'prop-types';
import OnboardingWizard from '../../OnboardingWizard';
import { useIntl } from 'react-intl';
import DialogNameStep from './DialogNameStep';
import DialogReasonStep from './DialogReasonStep';
import AddOptionsStep from './AddOptionsStep';
import CreatingDialogStep from './CreatingDialogStep';
import DialogExpirationStep from './DialogExpirationStep';

function DialogWizard (props) {

  const { hidden, onStartOver } = props;
  const intl = useIntl();


  const stepProtoTypes = [
    {
      label: 'DialogWizardDialogNameStepLabel',
      content: <DialogNameStep/>,
    },
    {
      label: 'DialogWizardDialogReasonStepLabel',
      content: <DialogReasonStep />,
    },
    {
      label: 'DialogWizardDialogExpirationStepLabel',
      content: <DialogExpirationStep />,
    },
    {
      label: 'DialogWizardAddOptionsStepLabel',
      content: <AddOptionsStep />,
    },
    {
      label: 'DialogWizardCreatingDialogStepLabel',
      content: <CreatingDialogStep />,
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