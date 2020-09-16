import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { TextField, Typography } from '@material-ui/core';
import { useIntl } from 'react-intl';
import _ from 'lodash';
import StepButtons from '../../StepButtons';
import WizardStepContainer from '../../WizardStepContainer';
import { WizardStylesContext } from '../../WizardStylesContext';

function WorkspaceNameStep (props) {
  const { updateFormData, formData } = props;
  const classes = useContext(WizardStylesContext);
  const intl = useIntl();
  const value = formData.workspaceName || '';
  const validForm = !_.isEmpty(value);
  const titleId = 'ReqWorkspaceWizardNameStepLabel';

  function onNameChange (event) {
    const { value } = event.target;
    updateFormData({
      workspaceName: value
    });
  }

  return (
    <WizardStepContainer
      titleId={titleId}
      {...props}
    >
      <div>
        <Typography className={classes.introText} variant="body2">
          {intl.formatMessage({ id: 'ReqWorkspaceNameStepIntro' })}
        </Typography>
        <Typography className={classes.introText} variant="body2">
          {intl.formatMessage({ id: 'ReqWorkspaceNameStepHelp' })}
        </Typography>
        <label className={classes.inputLabel}
               htmlFor="name">{intl.formatMessage({ id: 'WorkspaceWizardMeetingPlaceHolder' })}</label>
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
  active: PropTypes.bool,
};

WorkspaceNameStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
  active: false,
};

export default WorkspaceNameStep;