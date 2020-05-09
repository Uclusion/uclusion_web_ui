import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { TextField, Typography } from '@material-ui/core';
import { useIntl } from 'react-intl';
import _ from 'lodash';
import StepButtons from './StepButtons';
import QuillEditor from '../../components/TextEditors/QuillEditor';


function CurrentStoryStep (props) {
  const { updateFormData, formData } = props;
  const intl = useIntl();
  const {
    currentStoryName,
    currentStoryUploadedFiles,
  } = formData;
  const [editorContents, setEditorContents] = useState('');
  const storyName = currentStoryName || '';
  const validForm = !_.isEmpty(currentStoryName) && !_.isEmpty(editorContents);

  function onChange(name){
    return (event) => {
      const { value } = event.target;
      updateFormData(name, value);
    };
  }


  function onEditorChange(content) {
    setEditorContents(content);
  }

  function onS3Upload(metadatas) {
    const oldUploadedFiles = currentStoryUploadedFiles || []
    const newUploadedFiles = _.uniqBy([...oldUploadedFiles, metadatas], 'path');
    updateFormData('currentStoryUploadedFiles', newUploadedFiles);
  }

  function onNext() {
    updateFormData('currentStoryDescription', editorContents);
  }

  return (
    <div>
      <Typography>
        What story are you currently working on?
      </Typography>
      <TextField
        placeholder={intl.formatMessage({ id: 'OnboardingWizardCurrentStoryNamePlaceHolder' })}
        value={storyName}
        onChange={onChange('currentStoryName')}
      />
      <QuillEditor
        placeholder={intl.formatMessage({ id: 'OnboardingWizardCurrentStoryDescriptionPlaceHolder'})}
        value={currentStoryName}
        onS3Upload={onS3Upload}
        onChange={onEditorChange}
        />
      <StepButtons {...props} validForm={validForm} onNext={onNext}/>
    </div>
  );
}

CurrentStoryStep.propTypes = {
  updateFormData: PropTypes.func.isRequired,
  formData: PropTypes.object.isRequired,
};

export default CurrentStoryStep;