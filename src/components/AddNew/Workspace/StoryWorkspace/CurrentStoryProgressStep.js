import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import { useIntl } from 'react-intl'
import _ from 'lodash'
import StepButtons from '../../StepButtons'
import QuillEditor from '../../../TextEditors/QuillEditor'
import { DaysEstimate } from '../../../AgilePlan'
import { urlHelperGetName } from '../../../../utils/marketIdPathFunctions'
import { MarketsContext } from '../../../../contexts/MarketsContext/MarketsContext'
import { InvestiblesContext } from '../../../../contexts/InvestibesContext/InvestiblesContext'
import WizardStepContainer from '../../WizardStepContainer';
import { WizardStylesContext } from '../../WizardStylesContext';
import { useEditor } from '../../../TextEditors/quillHooks';

function CurrentStoryProgressStep (props) {
  const { updateFormData, formData} = props;
  const intl = useIntl();
  const {
    currentStoryProgress,
    currentStoryEstimate,
  } = formData;
  const classes = useContext(WizardStylesContext);
  const [editorContents, setEditorContents] = useState(currentStoryProgress || '');

  const validForm = _.isNumber(currentStoryEstimate);

  function onEditorChange(content) {
    setEditorContents(content);
  }

  function onEstimateChange(event) {
    const { value } = event.target;
    const valueInt = value ? parseInt(value, 10) : null;
    updateFormData({
      currentStoryEstimate: valueInt
    });
  }

  function onStepChange() {
    updateFormData({
      currentStoryProgress: editorContents,
      currentStoryProgressSkipped: false,
    });
  }

  function onSkip() {
    updateFormData({
      currentStoryProgress: editorContents,
      currentStoryProgressSkipped: true,
    });
  }

  const editorName = 'CurrentStoryProgressStep-editor';
  const editorSpec = {
    onChange: onEditorChange,
    simple: true,
    value: editorContents,
    placeholder: intl.formatMessage({ id: 'OnboardingWizardCurrentStoryProgressPlaceHolder'}),
    dontManageState: true,
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