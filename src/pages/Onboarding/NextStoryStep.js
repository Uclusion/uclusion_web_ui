import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { TextField, Typography } from '@material-ui/core';
import { useIntl } from 'react-intl';
import _ from 'lodash';
import StepButtons from './StepButtons';
import QuillEditor from '../../components/TextEditors/QuillEditor';


function NextStoryStep (props) {
  const { updateFormData, formData, active } = props;
  const intl = useIntl();
  const {
    nextStoryName,
    nextStoryDescription,
    nextStoryUploadedFiles,
  } = formData;
  const [editorContents, setEditorContents] = useState(nextStoryDescription);
  const storyName = nextStoryName || '';
  const validForm = !_.isEmpty(nextStoryName) && !_.isEmpty(editorContents);

  function onChange(name){
    return (event) => {
      const { value } = event.target;
      updateFormData(name, value);
    };
  }

  if (!active) {
    return React.Fragment;
  }

  function onEditorChange(content) {
    setEditorContents(content);
  }

  function onS3Upload(metadatas) {
    const oldUploadedFiles = nextStoryUploadedFiles || []
    const newUploadedFiles = _.uniqBy([...oldUploadedFiles, metadatas], 'path');
    updateFormData('nextStoryUploadedFiles', newUploadedFiles);
  }

  function onStepChange(skip) {
    updateFormData('nextStoryDescription', editorContents);
    if (!skip) {
      updateFormData('nextStorySkipped', false);
    }
  }

  function onSkip() {
    updateFormData('nextStorySkipped', true);
    onStepChange(true);
  }

  return (
    <div>
      <Typography>
        Do you have a story you want to work on next? If so, enter it here and it will become a "Proposed" story
        in your workspace. Others can vote on whether or not you should be doing it, BEFORE you start work.
        If you don't have one, that's OK, you can add it after the Workspace has been created. We'll also
        periodically remind you to create one later.
      </Typography>
      <TextField
        placeholder={intl.formatMessage({ id: 'OnboardingWizardNextStoryNamePlaceHolder' })}
        value={storyName}
        onChange={onChange('nextStoryName')}
      />
      <QuillEditor
        placeholder={intl.formatMessage({ id: 'OnboardingWizardNextStoryDescriptionPlaceHolder'})}
        value={editorContents}
        defaultValue={editorContents}
        onS3Upload={onS3Upload}
        onChange={onEditorChange}
        />
      <StepButtons {...props} validForm={validForm}
                   showSkip
                   onPrevious={onStepChange}
                   onSkip={onSkip}
                   onNext={onStepChange}/>
    </div>
  );
}

NextStoryStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
  active: PropTypes.bool,
};

NextStoryStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
  active: false,
};

export default NextStoryStep;