import React from 'react';
import Screen from '../../containers/Screen/Screen';
import LoadingDisplay from '../../components/LoadingDisplay';

function Onboarding() {
  return (
    <Screen
      title="Welcome To Uclusion"
      tabTitle="Welcome to Uclusion"
    >
      <LoadingDisplay
        showMessage={true}
        messageId="creatingDemoMessage"
      />

    </Screen>
  )
}

export default Onboarding;

