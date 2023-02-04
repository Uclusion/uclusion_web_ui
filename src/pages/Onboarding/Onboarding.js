import React from 'react';
import PropTypes from 'prop-types';
import WorkspaceWizard from '../../components/AddNewWizards/Workspace/WorkspaceWizard';
import Screen from '../../containers/Screen/Screen';

function Onboarding(props) {
  const { setInOnboarding } = props;

  return (
    <Screen
      title="Welcome To Uclusion"
      tabTitle="Welcome to Uclusion"
    >
      <WorkspaceWizard onboarding={true} setInOnboarding={setInOnboarding} />
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

