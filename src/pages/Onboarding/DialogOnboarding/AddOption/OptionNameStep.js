import React from 'react';
import { useIntl } from 'react-intl';
import _ from 'lodash';
import { updateValues } from '../../onboardingReducer';
import { TextField, Typography } from '@material-ui/core';
import StepButtons from '../../StepButtons';
import PropTypes from 'prop-types';

function OptionNameStep(props) {
  const { updateFormData, formData, active, classes } = props;
  const intl = useIntl();

  const value = formData.optionName || '';

  if (!active) {
    return React.Fragment;
  }
  const validForm = !_.isEmpty(value);

  function onNameChange(event) {
    const { value } = event.target;
    updateFormData(updateValues({
      optionName: value,
    }));
  }

  return (
    <div>
      <Typography className={classes.introText} variant="body2">
        Every option to chose from needs a good name. It should be short, but descriptive, and tell your team
        at a glance what the option is all about.
      </Typography>
      <label className={classes.inputLabel} htmlFor="name">{intl.formatMessage({ id: 'AddOptionWizardOptionNamePlaceHolder' })}</label>
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

OptionNameStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
  active: PropTypes.bool,
};

OptionNameStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
  active: false,
};

export default OptionNameStep;