import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import { useIntl } from 'react-intl'
import _ from 'lodash'
import StepButtons from '../../StepButtons'
import { DaysEstimate } from '../../../AgilePlan'
import WizardStepContainer from '../../WizardStepContainer';
import { WizardStylesContext } from '../../WizardStylesContext';
import { useEditor } from '../../../TextEditors/quillHooks';
import { getQuillStoredState } from '../../../TextEditors/QuillEditor2'

function CurrentStoryProgressStep (props) {
  const { updateFormData, formData} = props;
  const intl = useIntl();
  const {
    currentStoryEstimate,
  } = formData;
  const classes = useContext(WizardStylesContext);
  const validForm = _.isNumber(currentStoryEstimate);

  function onEstimateChange(event) {
    const { value } = event.target;
    const valueInt = value ? parseInt(value, 10) : null;
    updateFormData({
      currentStoryEstimate: valueInt
    });
  }

  function onStepChange() {
    updateFormData({
      currentStoryProgress: getQuillStoredState(editorName),
      currentStoryProgressSkipped: false,
    });
  }

  function onSkip() {
    updateFormData({
      currentStoryProgress: getQuillStoredState(editorName),
      currentStoryProgressSkipped: true,
    });
  }

  const editorName = 'CurrentStoryProgressStep-editor';
  const editorSpec = {
    simple: true,
    value: getQuillStoredState(editorName),
    placeholder: intl.formatMessage({ id: 'OnboardingWizardCurrentStoryProgressPlaceHolder'}),
  }
  const [Editor] = useEditor(editorName, editorSpec);

  return (
    <WizardStepContainer
      {...props}
      titleId="OnboardingWizardCurrentStoryProgressStepLabel"
    >
    <div>
      <Typography variant="body1">
        Great, now that we have what you're currently working on, we can provide an update by
        telling everyone when you expect to be done and the current status. Fill in as much as you know or
        simply hit 'Skip'.
      </Typography>
      <div className={classes.spacer}/>
      <div className={classes.dateContainer}>
        <label className={classes.inputLabel}>{intl.formatMessage({ id: "daysEstimateMarketLabel" })}</label>
        <DaysEstimate showLabel={false} showHelper={false} onChange={onEstimateChange} value={currentStoryEstimate} createdAt={new Date()} />
      </div>
      <div className={classes.borderBottom}/>
      {Editor}
      <div className={classes.borderBottom}/>
      <StepButtons {...props} validForm={validForm}
                   onPrevious={onStepChange}
                   onNext={onStepChange}
                   showSkip
                   onSkip={onSkip}/>
    </div>
    </WizardStepContainer>
  );
}

CurrentStoryProgressStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,

};

CurrentStoryProgressStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
};


export default CurrentStoryProgressStep;