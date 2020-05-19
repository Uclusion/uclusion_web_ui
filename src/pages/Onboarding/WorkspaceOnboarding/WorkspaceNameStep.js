import React from 'react';
import PropTypes from 'prop-types';
import { TextField, Typography } from '@material-ui/core';
import { useIntl } from 'react-intl';
import _ from 'lodash';
import StepButtons from '../StepButtons';
import { updateValues } from '../onboardingReducer';

function WorkspaceNameStep (props) {
  const { updateFormData, formData, active, classes } = props;
  const intl = useIntl();
  const value = formData.meetingName || '';
  const validForm = !_.isEmpty(value);

  function onNameChange (event) {
    const { value } = event.target;
    updateFormData(updateValues({
      meetingName: value
    }));
  }

  if (!active) {
    return React.Fragment;
  }

  return (
    <div>
      <Typography className={classes.introText} variant="body2">
        Great! We're going to be creating a Uclusion Workspace that tracks stories, notifies people
        when their input is needed, lets them weigh in on stories before they begin implementation, and provides
        structured communication around stories.
      </Typography>
      <Typography className={classes.introText} variant="body2">
        To do this we'll need a short, but descriptive name for your Workspace.
      </Typography>
      <label className={classes.inputLabel} htmlFor="name">{intl.formatMessage({ id: 'WorkspaceWizardMeetingPlaceHolder' })}</label>
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

WorkspaceNameStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
  active: PropTypes.bool,
};

WorkspaceNameStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
  active: false,
};

export default WorkspaceNameStep;