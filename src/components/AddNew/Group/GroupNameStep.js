import React, { useContext } from 'react';
import PropTypes from 'prop-types'
import { TextField, Typography } from '@material-ui/core'
import { useIntl } from 'react-intl'
import _ from 'lodash'
import StepButtons from '../StepButtons'
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';

function GroupNameStep (props) {
  const { updateFormData, formData } = props;
  const intl = useIntl();
  const value = formData.name || '';
  const validForm = !_.isEmpty(value);
  const classes = useContext(WizardStylesContext);

  function onNameChange (event) {
    const { value } = event.target;
    updateFormData({
      name: value
    });
  }

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText} variant="h6">
        A group organizes a team and its jobs.
      </Typography>
      <label className={classes.inputLabel} htmlFor="name">
        {intl.formatMessage({ id: 'GroupWizardMeetingName' })}
      </label>
      <TextField
        id="workspaceName"
        className={classes.input}
        value={value}
        onChange={onNameChange}
      />
      <Typography className={classes.introText} variant="body1">
        Finish after choosing a name or continue for options which can be changed at any time.
      </Typography>
      <div className={classes.borderBottom} />
      <StepButtons {...props} validForm={validForm} showFinish={true} />
    </div>
    </WizardStepContainer>
  );
}

GroupNameStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

GroupNameStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default GroupNameStep;