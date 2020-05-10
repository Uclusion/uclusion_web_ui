import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import { useIntl } from 'react-intl'
import _ from 'lodash'
import StepButtons from './StepButtons'
import QuillEditor from '../../components/TextEditors/QuillEditor'
import { DaysEstimate } from '../../components/AgilePlan'

function CurrentStoryProgressStep (props) {
  const { updateFormData, formData } = props;
  const intl = useIntl();
  const {
    currentStoryProgress,
    currentStoryEstimate,
  } = formData;
  console.log(formData);
  const [editorContents, setEditorContents] = useState('');

  const validForm = !_.isEmpty(editorContents) && _.isNumber(currentStoryEstimate);

  function onEditorChange(content) {
    setEditorContents(content);
  }

  function onEstimateChange(event) {
    const { value } = event.target;
    const valueInt = value ? parseInt(value, 10) : null;
    updateFormData('currentStoryEstimate', valueInt);
  }

  function onNext() {
    updateFormData('currentStoryProgress', editorContents);
  }

  function onSkip() {
    updateFormData('currentStoryEstimate', undefined);
    updateFormData('currentStoryProgress', undefined);
  }
  console.log(currentStoryEstimate);
  return (
    <div>
      <Typography>
        What is your current progress on the story, and when do you think it will be done by?
      </Typography>
      <QuillEditor
        placeholder={intl.formatMessage({ id: 'OnboardingWizardCurrentStoryProgressPlaceHolder'})}
        value={currentStoryProgress}
        simple
        onChange={onEditorChange}
      />
      <DaysEstimate onChange={onEstimateChange} value={currentStoryEstimate} createdAt={new Date()} />
      <StepButtons {...props} validForm={validForm} onNext={onNext} showSkip onSkip={onSkip}/>
    </div>
  );
}

CurrentStoryProgressStep.propTypes = {
  updateFormData: PropTypes.func.isRequired,
  formData: PropTypes.object.isRequired,
};

export default CurrentStoryProgressStep;