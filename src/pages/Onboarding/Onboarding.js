import React from 'react';
import PropTypes from 'prop-types';
import WorkspaceWizard from '../../components/AddNew/Workspace/WorkspaceWizard';
import Screen from '../../containers/Screen/Screen';

// used if we're the wizard running on onboarding
export const ONBOARDING_WIZARD_KEY="onboarding_wizard";

function Onboarding(props) {
  const { onFinish, onStartOnboarding } = props;

  const myOnFinish = () => {
    onFinish();
  }
  return (
    <Screen
      title="Welcome To Uclusion"
      tabTitle="Welcome to Uclusion"
    >
    <WorkspaceWizard onboarding={true} onStartOnboarding={onStartOnboarding} onFinish={myOnFinish}/>
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

