import React from 'react'
import PropTypes from 'prop-types'
import CreationWizard from '../CreationWizard'
import { useIntl } from 'react-intl'
import DialogNameStep from './DialogNameStep'
import DialogReasonStep from './DialogReasonStep'
import AddOptionsStep from './AddOptionsStep'
import DialogExpirationStep from './DialogExpirationStep'

function DialogWizard (props) {

  const { hidden, onStartOver, isHome, onFinish } = props;
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
  ];

  return (
    <CreationWizard
      hidden={hidden}
      isHome={isHome}
      onFinish={onFinish}
      title={intl.formatMessage({ id: 'DialogWizardTitle' })}
      onStartOver={onStartOver}
      stepPrototypes={stepProtoTypes}
    />
  );

}

DialogWizard.propTypes = {
  hidden: PropTypes.bool.isRequired,
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  isHome: PropTypes.bool,
};

DialogWizard.defaultProps = {
  onStartOver: () => {},
  isHome: false,
  onFinish: () => {},
};

export default DialogWizard;