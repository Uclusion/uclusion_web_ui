import React, { useContext } from 'react';
import PropTypes from 'prop-types'
import { TextField, Typography } from '@material-ui/core'
import { useIntl } from 'react-intl'
import _ from 'lodash'
import StepButtons from '../../StepButtons'
import WizardStepContainer from '../../WizardStepContainer';
import { WizardStylesContext } from '../../WizardStylesContext';

function WorkspaceNameStep (props) {
  const { updateFormData, formData } = props;
  const intl = useIntl();
  const value = formData.meetingName || '';
  const validForm = !_.isEmpty(value);
  const classes = useContext(WizardStylesContext);

  function onNameChange (event) {
    const { value } = event.target;
    updateFormData({
      meetingName: value
    });
  }

  return (
    <WizardStepContainer
      {...props}
      titleId="WorkspaceWizardMeetingStepLabel"
    >
    <div>
      <Typography className={classes.introText} variant="body2">
        Great! We're going to be creating a Uclusion Workspace that tracks stories, notifies people
        when their input is needed, lets them weigh in on stories before implementation, and provides
        structured communication.
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
    </WizardStepContainer>
  );
}

WorkspaceNameStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
};

WorkspaceNameStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
  active: false,
};

export default WorkspaceNameStep;