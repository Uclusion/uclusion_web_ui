import React from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { TextField, Typography } from '@material-ui/core';
import StepButtons from '../StepButtons';
import { updateValues } from '../onboardingReducer';
import { useIntl } from 'react-intl';

function DialogNameStep (props) {

  const { updateFormData, formData, active, classes } = props;
  const intl = useIntl();

  const value = formData.dialogName || '';

  if (!active) {
    return React.Fragment;
  }
  const validForm = !_.isEmpty(value);

  function onNameChange(event) {
    const { value } = event.target;
    updateFormData(updateValues({
      dialogName: value,
    }));
  }

  return (
    <div>
      <Typography className={classes.introText} variant="body2">
        Great! We'll be creating a Uclusion Dialog that will help your team manage the process of choosing among a few options.
      </Typography>
      <Typography className={classes.introText} variant="body2">
        To do this we'll need a good name for the decision that tells people at a glance what they're deciding about.
        A good name should be short, but descriptive.
      </Typography>
      <label className={classes.inputLabel} htmlFor="name">{intl.formatMessage({ id: 'DialogWizardDialogNamePlaceHolder' })}</label>
      <TextField
        id="name"
        className={classes.input}
        value={value}
        onChange={onNameChange}
      />
      <div className={classes.borderBottom}></div>
      <StepButtons {...props} validForm={validForm}/>
    </div>
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