import React, { useState } from 'react';
import PropTypes from 'prop-types';
// Note: the stepwizard will die horribly if there's only one currentStep.
import StepWizard from 'react-step-wizard';
import MeetingStep from './MeetingStep';
import Screen from '../../containers/Screen/Screen';
import CurrentStoryStep from './CurrentStoryStep';
import CurrentStoryProgressStep from './CurrentStoryProgressStep';
import CreatingWorkspaceStep from './CreatingWorkspaceStep';

function OnboardingWizard(props) {
  const { hidden } = props;

  const [state, setState] = useState({ formData: {}});

  function updateFormData(key, value) {
    const { formData } = state;
    const newData = {
      ...formData,
      [key]: value,
    }
    setState({
      ...state,
      formData: newData,
    });
  }
  const { formData } = state;
  return (
    <Screen
      tabTitle={'Onboarding'}
      hidden={hidden}
      >
      <StepWizard>
        <MeetingStep updateFormData={updateFormData} formData={formData} />
        <CurrentStoryStep updateFormData={updateFormData} formData={formData} />
        <CurrentStoryProgressStep updateFormData={updateFormData} formData={formData}/>
        <CreatingWorkspaceStep formData={formData}/>
      </StepWizard>
    </Screen>
  );
}

OnboardingWizard.propTypes = {
  hidden: PropTypes.bool.isRequired,
}

export default OnboardingWizard;