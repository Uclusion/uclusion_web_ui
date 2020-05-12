import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import { useIntl } from 'react-intl'
import _ from 'lodash'
import StepButtons from './StepButtons'
import QuillEditor from '../../components/TextEditors/QuillEditor'
import { DaysEstimate } from '../../components/AgilePlan'

function CurrentStoryProgressStep (props) {
  const { updateFormData, formData, active } = props;
  const intl = useIntl();
  const {
    currentStoryProgress,
    currentStoryEstimate,
  } = formData;
  console.log(formData);
  const [editorContents, setEditorContents] = useState(currentStoryProgress);

  const validForm = !_.isEmpty(editorContents) && _.isNumber(currentStoryEstimate);

  function onEditorChange(content) {
    setEditorContents(content);
  }

  function onEstimateChange(event) {
    const { value } = event.target;
    const valueInt = value ? parseInt(value, 10) : null;
    updateFormData('currentStoryEstimate', valueInt);
  }

  function onStepChange(skip) {
    updateFormData('currentStoryProgress', editorContents);
    if (!skip) {
      updateFormData(updateFormData('currentStoryProgressSkipped', false));
    }
  }

  function onSkip() {
    updateFormData('currentStoryProgressSkipped', true);
    onStepChange(true);
  }

  if (!active) {
    return React.Fragment;
  }

  return (
    <div>
      <Typography>
        Great, now that we have what you're currently working on, we can provide everyone a status update by
        telling everyone when you expect to be done and what they current status is. If you don't know these things,
        right now, we'll remind you to fill it in later, so you can simply hit 'Skip' for now.
      </Typography>
      <QuillEditor
        placeholder={intl.formatMessage({ id: 'OnboardingWizardCurrentStoryProgressPlaceHolder'})}
        defaultValue={editorContents}
        value={editorContents}
        simple
        onChange={onEditorChange}
      />
      <DaysEstimate onChange={onEstimateChange} value={currentStoryEstimate} createdAt={new Date()} />
      <StepButtons {...props} validForm={validForm}
                   onPrevious={onStepChange}
                   onNext={onStepChange} showSkip onSkip={onSkip}/>
    </div>
  );
}

CurrentStoryProgressStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
  active: PropTypes.bool,
};

CurrentStoryProgressStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
  active: false,
};


export default CurrentStoryProgressStep;