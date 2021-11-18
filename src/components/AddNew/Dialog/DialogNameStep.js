import React, { useContext } from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { TextField, Typography } from '@material-ui/core';
import StepButtons from '../StepButtons';
import { useIntl } from 'react-intl';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';

function DialogNameStep (props) {

  const { updateFormData, formData } = props;
  const intl = useIntl();
  const classes = useContext(WizardStylesContext);

  const value = formData.dialogName || '';

  const validForm = !_.isEmpty(value);

  function onNameChange (event) {
    const { value } = event.target;
    updateFormData({
      dialogName: value,
    });
  }

  return (
    <WizardStepContainer
      {...props}
      titleId="DialogWizardDialogNameStepLabel"
    >
      <div>
        <Typography className={classes.introText} variant="body2">
          We'll be creating a Uclusion Dialog to collaborate outside a Workspace on options.
        </Typography>
        <label className={classes.inputLabel}
               htmlFor="name">{intl.formatMessage({ id: 'DialogWizardDialogNamePlaceHolder' })}</label>
        <TextField
          id="name"
          className={classes.input}
          value={value}
          onChange={onNameChange}
        />
        <div className={classes.borderBottom} />
        <StepButtons {...props} validForm={validForm} showFinish={false}/>
      </div>
    </WizardStepContainer>
  );

}

DialogNameStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
  active: PropTypes.bool,
};

DialogNameStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
  active: false,
};

export default DialogNameStep;