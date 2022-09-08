import React from 'react';
import WorkspaceWizard from '../../components/AddNew/Workspace/WorkspaceWizard';
import Screen from '../../containers/Screen/Screen';

function Onboarding() {
  return (
    <Screen
      title="Welcome To Uclusion"
      tabTitle="Welcome to Uclusion"
    >
    <WorkspaceWizard/>
    </Screen>
  )
}

export default Onboarding;