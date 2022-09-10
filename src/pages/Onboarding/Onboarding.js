import React from 'react';
import WorkspaceWizard from '../../components/AddNew/Workspace/WorkspaceWizard';
import Screen from '../../containers/Screen/Screen';
import { setUclusionLocalStorageItem } from '../../components/localStorageUtils';

// used if we're the wizard running on onboarding
export const ONBOARDING_WIZARD_KEY="onboarding_wizard";

function Onboarding() {

  const onFinish = () => {
    setUclusionLocalStorageItem(ONBOARDING_WIZARD_KEY, false);
  }
  return (
    <Screen
      title="Welcome To Uclusion"
      tabTitle="Welcome to Uclusion"
    >
    <WorkspaceWizard onboarding={true} onFinish={onFinish}/>
    </Screen>
  )
}

export default Onboarding;