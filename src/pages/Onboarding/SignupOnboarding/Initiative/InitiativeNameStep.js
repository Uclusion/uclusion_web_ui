import React from 'react'
import _ from 'lodash'
import PropTypes from 'prop-types'
import { TextField, Typography } from '@material-ui/core'
import StepButtons from '../../StepButtons'
import { updateValues } from '../../onboardingReducer'
import { useIntl } from 'react-intl'

function InitiativeNameStep (props) {

  const { updateFormData, formData, active, classes } = props;
  const intl = useIntl();

  const value = formData.initiativeName || '';

  if (!active) {
    return React.Fragment;
  }
  const validForm = !_.isEmpty(value);

  function onNameChange(event) {
    const { value } = event.target;
    updateFormData(updateValues({
      initiativeName: value,
    }));
  }

  return (
    <div>
      <Typography className={classes.introText} variant="body2">
        Great! We'll be creating a Uclusion Initiative that allows people you invite to vote for or against your idea.
      </Typography>
      <label className={classes.inputLabel} htmlFor="name">{intl.formatMessage({ id: 'InitiativeWizardInitiativeNamePlaceholder' })}</label>
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

InitiativeNameStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
  active: PropTypes.bool,
};

InitiativeNameStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
  active: false,
};

export default InitiativeNameStep;