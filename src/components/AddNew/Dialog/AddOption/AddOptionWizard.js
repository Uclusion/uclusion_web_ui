import React from 'react';
import PropTypes from 'prop-types';
import OptionNameStep from './OptionNameStep';
import OptionDescriptionStep from './OptionDescriptionStep';
import { WizardStylesProvider } from '../../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';


function AddOptionWizard (props) {
  const { onStartOver, onFinish } = props;

  return (
    <WizardStylesProvider>
      <FormdataWizard name="dialog_add_options_wizard"
                      onFinish={onFinish}
                      onStartOver={onStartOver}
      >
        <OptionNameStep/>
        <OptionDescriptionStep/>
      </FormdataWizard>
    </WizardStylesProvider>
  );

}

AddOptionWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
};

AddOptionWizard.defaultProps = {
  onStartOver: () => {},
  onFinish: () => {},
};

export default AddOptionWizard;