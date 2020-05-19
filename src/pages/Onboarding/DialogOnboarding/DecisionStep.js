import React from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import StepButtons from '../StepButtons';
import { updateValues } from '../onboardingReducer';

function DecisionStep (props) {

  const { updateFormData, formData, active, classes } = props;

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
        Great! We'll be creating a Uclusion Dialog that will manage the process of choosing from a few options.
      </Typography>
      <Typography className={classes.introText} variant="body2">
        To do this we'll need a good name for the decision that tells people at a glance what they're deciding about.
        A good name should be short, but descriptive.
      </Typography>;

      <div className={classes.borderBottom}></div>
      <StepButtons {...props} validForm={validForm}/>
    </div>
  );

}

DecisionStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
  active: PropTypes.bool,
};

DecisionStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
  active: false,
};