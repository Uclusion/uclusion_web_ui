import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import _ from 'lodash'
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { getQuillStoredState } from '../../TextEditors/Utilities/CoreUtils'
import { useEditor } from '../../TextEditors/quillHooks'

function JobDescriptionStep (props) {
  const editorName = "addJobWizard"
  const [value, setValue] = useState(getQuillStoredState(editorName));
  const validForm = !_.isEmpty(value);
  const classes = useContext(WizardStylesContext);

  /// TODO, fill in the group id and market id
  const marketId = null;
  const groupId = "";
  const editorSpec = {
    placeholder: "Ex: make magic happen via A, B, C",
    value,
    onChange: setValue,
  };

  const [Editor] = useEditor(editorName, editorSpec);

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText}>
        What has to be done?
      </Typography>
      {Editor}
      <div className={classes.borderBottom} />
      <WizardStepButtons
        {...props}
        validForm={validForm}
        nextLabel="JobWizardAssignJob"
        showFinish={validForm}
        finishLabel="JobWizardGotoJob"/>
    </div>
    </WizardStepContainer>
  );
}

JobDescriptionStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

JobDescriptionStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default JobDescriptionStep;