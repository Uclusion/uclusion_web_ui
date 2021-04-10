import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { TextField, Typography } from '@material-ui/core';
import { useIntl } from 'react-intl';
import _ from 'lodash';
import StepButtons from '../../StepButtons';
import { WizardStylesContext } from '../../WizardStylesContext';
import WizardStepContainer from '../../WizardStepContainer';
import { useEditor } from '../../../TextEditors/quillHooks';

function NextStoryStep (props) {
  const { updateFormData, formData } = props;

  const intl = useIntl();
  const classes = useContext(WizardStylesContext);
  const {
    nextStoryName,
    nextStoryDescription,
    nextStoryUploadedFiles,
  } = formData;
  const [editorContents, setEditorContents] = useState(nextStoryDescription || '');
  const storyName = nextStoryName || '';
  const validForm = !_.isEmpty(nextStoryName);

  const editorName = "NextStoryStep-editor";
  const editorSpec = {
    placeholder: intl.formatMessage({ id: 'OnboardingWizardNextStoryDescriptionPlaceHolder' }),
    value: editorContents,
    onUpload: onS3Upload,
    onChange: onEditorChange,
    dontManageState: true,
  };

  const [Editor] = useEditor(editorName, editorSpec);

  function onNameChange (event) {
    const { value } = event.target;
    updateFormData({
      nextStoryName: value
    });
  }

  function onEditorChange (content) {
    setEditorContents(content);
  }

  function onS3Upload (metadatas) {
    const oldUploadedFiles = nextStoryUploadedFiles || [];
    const newUploadedFiles = _.uniqBy([...oldUploadedFiles, ...metadatas], 'path');
    updateFormData({ nextStoryUploadedFiles: newUploadedFiles });
  }

  function updateState(nextStorySkipped) {
    const newValues = {
      nextStoryDescription: editorContents,
      nextStorySkipped,
    };
    updateFormData(newValues);
  }


  function onPrevious () {
    updateState(false);
  }

  function onNext () {
    updateState(false);
  }

  function onSkip () {
    updateState(true);
  }

  return (
    <WizardStepContainer
      {...props}
      titleId="OnboardingWizardNextStoryStepLabel"
    >
      <div>
        <Typography variant="body1">
          Do you have a story you want to work on next? If so, enter it here and it will become a "Proposed" story
          in your workspace. Others can approve, <strong>BEFORE</strong> you start work.
          If you don't have one, that's OK, you can add it after the Workspace has been created.
        </Typography>
        <label className={classes.inputLabel}>Name your next story</label>
        <TextField
          className={classes.input}
          value={storyName}
          onChange={onNameChange}
        />
        {Editor}
        <div className={classes.borderBottom}/>
        <StepButtons
          {...props}
          validForm={validForm}
          showSkip
          spinOnClick
          onPrevious={onPrevious}
          onSkip={onSkip}
          onNext={onNext}/>
      </div>
    </WizardStepContainer>
  );
}

NextStoryStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
};

NextStoryStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
};

export default NextStoryStep;