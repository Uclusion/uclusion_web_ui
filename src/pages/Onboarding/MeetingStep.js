import React from 'react';
import PropTypes from 'prop-types';
import { TextField, Typography } from '@material-ui/core';
import { useIntl } from 'react-intl';
import _ from 'lodash';
import StepButtons from './StepButtons';

function MeetingStep (props) {
  const { updateFormData, formData, active } = props;
  const intl = useIntl();
  const value = formData.meetingName || '';
  const validForm = !_.isEmpty(value);

  function onChange (event) {
    const { value } = event.target;
    updateFormData('meetingName', value);
  }

  if (!active) {
    return React.Fragment;
  }

  return (
    <div>
      <Typography>
        We're going to be creating a Uclusion Workspace that can replace your meeting that handles stories and story status.
        To do this we'll need the name of that meeting, which will become the name of your Workspace. You can fill in any
        detailed description for the Workspace after it's been created by editing it later.
      </Typography>
      <TextField
        placeholder={intl.formatMessage({ id: 'OnboardingWizardMeetingPlaceHolder' })}
        value={value}
        onChange={onChange}
      />
      <StepButtons {...props} validForm={validForm}/>
    </div>
  );
}

MeetingStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
  active: PropTypes.bool,
};

MeetingStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
  active: false,
};

export default MeetingStep;