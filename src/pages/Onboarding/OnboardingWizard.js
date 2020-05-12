import React, { useState, useReducer } from 'react';
import PropTypes from 'prop-types';
import { Stepper, Step, StepLabel } from '@material-ui/core';
import MeetingStep from './MeetingStep';
import Screen from '../../containers/Screen/Screen';
import CurrentStoryStep from './CurrentStoryStep';
import CurrentStoryProgressStep from './CurrentStoryProgressStep';
import CreatingWorkspaceStep from './CreatingWorkspaceStep';
import { useIntl } from 'react-intl';
import NextStoryStep from './NextStoryStep';
import { reducer } from './onboardingReducer';

function OnboardingWizard(props) {
  const { hidden } = props;

  const [formData, updateFormData] = useReducer(reducer, {});
  const intl = useIntl();

  const stepPrototypes = [
    {
      label: 'OnboardingWizardMeetingStepLabel',
      content: <MeetingStep />,
    },
    {
      label: 'OnboardingWizardCurrentStoryStepLabel',
      content: <CurrentStoryStep/>,
    },
    {
      label: 'OnboardingWizardCurrentStoryProgressStepLabel',
      content: <CurrentStoryProgressStep/>,
    },
    {
      label: 'OnboardingWizardNextStoryStepLabel',
      content: <NextStoryStep />,
    },
    {
      label: 'OnboardingWizardCreatingWorkspaceStepLabel',
      content: <CreatingWorkspaceStep/>,
    },
  ];

  const [stepState, setStepState] = useState({
    currentStep: 0,
    totalSteps: stepPrototypes.length,
  });

  function nextStep() {
    setStepState({
      ...stepState,
      currentStep: stepState.currentStep + 1,
    });
  }

  function previousStep() {
    if (stepState.currentStep === 0) {
      return;
    }
    setStepState({
      ...stepState,
      currentStep: stepState.currentStep - 1,
    });
  }

  function getStepHeaders(){


    return stepPrototypes.map((proto, index) => {
      const { label } = proto;
      return (
        <Step key={label}>
          <StepLabel>{intl.formatMessage({ id: label})}</StepLabel>
        </Step>
      );
    });
  }

  function getCurrentStepContents() {
    const props = {
      ...stepState,
      formData,
      updateFormData,
      nextStep,
      previousStep,
      active: true
    };
    console.error(formData);
    const { content } = stepPrototypes[stepState.currentStep];
    return React.cloneElement(content, props);
  }

  return (
    <Screen
      tabTitle={'Onboarding'}
      hidden={hidden}
      >
      <Stepper activeStep={stepState.currentStep}>
        {getStepHeaders()}
      </Stepper>
      <div>
        {getCurrentStepContents()}
      </div>
    </Screen>
  );
}

OnboardingWizard.propTypes = {
  hidden: PropTypes.bool.isRequired,
}

export default OnboardingWizard;