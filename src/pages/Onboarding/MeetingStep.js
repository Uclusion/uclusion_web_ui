import React from 'react';
import PropTypes from 'prop-types';
import { TextField, Typography } from '@material-ui/core';
import { useIntl } from 'react-intl';
import _ from 'lodash';
import StepButtons from './StepButtons';

function MeetingStep (props) {
  const { updateFormData, formData } = props;
  const intl = useIntl();
  const value = formData.meetingName || '';
  const validForm = !_.isEmpty(value);

  function onChange (event) {
    const { value } = event.target;
    updateFormData('meetingName', value);
  }

  return (
    <div>
      <Typography>
        What is the name of the meeting where you discuss stories?
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
  updateFormData: PropTypes.func.isRequired,
  formData: PropTypes.object.isRequired,
};

export default MeetingStep;