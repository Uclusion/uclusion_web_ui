import React, { useState, useReducer } from 'react';
import PropTypes from 'prop-types';
import { Stepper, Step, StepLabel } from '@material-ui/core';
import Screen from '../../containers/Screen/Screen';
import { useIntl } from 'react-intl';
import { reducer } from './onboardingReducer';

function OnboardingWizard(props) {
  const { hidden, stepPrototypes, title } = props;

  const [formData, updateFormData] = useReducer(reducer, {});
  const intl = useIntl();

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
    const currentStep = stepPrototypes[stepState.currentStep];
    if (!currentStep) {
      return React.Fragment;
    }
    const { content } = currentStep;
    return React.cloneElement(content, props);
  }

  return (
    <Screen
      tabTitle={title}
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
  title: PropTypes.string.isRequired,
  stepPrototypes: PropTypes.array,
}

OnboardingWizard.defaultProps = {
  stepPrototypes: [],
}

export default OnboardingWizard;