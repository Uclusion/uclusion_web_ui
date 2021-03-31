import React, { useContext } from 'react';
import { useIntl } from 'react-intl';
import _ from 'lodash';
import { TextField, Typography } from '@material-ui/core';
import StepButtons from '../../StepButtons';
import PropTypes from 'prop-types';
import WizardStepContainer from '../../WizardStepContainer';
import { WizardStylesContext } from '../../WizardStylesContext';

function OptionNameStep (props) {
  const { updateFormData, formData } = props;
  const intl = useIntl();
  const classes = useContext(WizardStylesContext);
  const value = formData.optionName || '';

  const validForm = !_.isEmpty(value);

  function onNameChange (event) {
    const { value } = event.target;
    updateFormData({
      optionName: value,
    });
  }

  return (
    <WizardStepContainer
      {...props}
      titleId="AddOptionWizardOptionNameStepLabel"
    >
      <div>
        <Typography className={classes.introText} variant="body2">
          The option name tells your team at a glance what the option is about. You do not
          need options like "Other" because collaborators can suggest their own at any time.
        </Typography>
        <label className={classes.inputLabel}
               htmlFor="name">{intl.formatMessage({ id: 'AddOptionWizardOptionNamePlaceHolder' })}</label>
        <TextField
          id="name"
          className={classes.input}
          value={value}
          onChange={onNameChange}
        />
        <div className={classes.borderBottom}></div>
        <StepButtons {...props} startOverLabel="AddOptionWizardCancelOption" validForm={validForm}/>
      </div>
    </WizardStepContainer>
  );
}

OptionNameStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
};

OptionNameStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
};

export default OptionNameStep;