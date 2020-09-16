import React from 'react'
import PropTypes from 'prop-types'
import DialogNameStep from './DialogNameStep'
import DialogReasonStep from './DialogReasonStep'
import AddOptionsStep from './AddOptionsStep'
import DialogExpirationStep from './DialogExpirationStep'
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';

function DialogWizard (props) {

  const { onStartOver, onFinish } = props;

  return (
    <WizardStylesProvider>
      <FormdataWizard name="dialog_wizard"
                      onFinish={onFinish}
                      onStartOver={onStartOver}
      >
        <DialogNameStep/>
        <DialogReasonStep />
        <DialogExpirationStep />
        <AddOptionsStep />
      </FormdataWizard>
    </WizardStylesProvider>
  );

}

DialogWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
};

DialogWizard.defaultProps = {
  onStartOver: () => {},
  onFinish: () => {},
};

export default DialogWizard;