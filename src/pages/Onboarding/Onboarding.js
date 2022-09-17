import React from 'react';
import PropTypes from 'prop-types';
import WorkspaceWizard from '../../components/AddNew/Workspace/WorkspaceWizard';
import Screen from '../../containers/Screen/Screen';

function Onboarding(props) {
  const { onFinish, onStartOnboarding } = props;

  return (
    <Screen
      title="Welcome To Uclusion"
      tabTitle="Welcome to Uclusion"
    >
      <WorkspaceWizard onboarding={true} onStartOnboarding={onStartOnboarding} onFinish={onFinish}/>
    </Screen>
  )
}

Onboarding.propTypes = {
  onFinish: PropTypes.func,
  onStartOnboarding: PropTypes.func
}


Onboarding.defaultProps = {
  onFinish: () => {},
  onStartOnboarding: () => {},
}

export default Onboarding;

