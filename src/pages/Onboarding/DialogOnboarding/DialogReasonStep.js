import React from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';

function DialogReasonStep(props) {
  const { updateFormData, formData, active, classes } = props;

  if (!active) {
    return React.Fragment;
  }

  return (
    <Typography className={classes.introText} variant="body2">
      Uclusion Dialogs can provide context outside of the options to help guide the decision.
      A great thing to put in the context is why the decision has to be made, which can be entered
      below.
    </Typography>
  )
}


DialogReasonStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
  active: PropTypes.bool,
};

DialogReasonStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
  active: false,
};