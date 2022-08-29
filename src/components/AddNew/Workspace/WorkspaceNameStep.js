import React, { useContext } from 'react';
import PropTypes from 'prop-types'
import { TextField, Typography } from '@material-ui/core'
import { useIntl } from 'react-intl'
import _ from 'lodash'
import StepButtons from '../StepButtons'
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';

function WorkspaceNameStep (props) {
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
      <Typography className={classes.introText} variant="h5">
        What do you want to call your workspace?
      </Typography>
      <Typography className={classes.introText} variant="subtitle1">
        It's best to pick something everyone will recognize.
      </Typography>
      <label className={classes.inputLabel} htmlFor="name">
        {intl.formatMessage({ id: 'WorkspaceWizardNameFieldLabel' })}
      </label>
      <TextField
        id="workspaceName"
        className={classes.input}
        value={value}
        onChange={onNameChange}
      />

      <div className={classes.borderBottom} />
      <StepButtons {...props} validForm={validForm} showFinish={false} />
    </div>
    </WizardStepContainer>
  );
}

WorkspaceNameStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

WorkspaceNameStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default WorkspaceNameStep;