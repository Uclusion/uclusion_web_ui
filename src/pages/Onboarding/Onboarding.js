import React from 'react';
import PropTypes from 'prop-types';
import Screen from '../../containers/Screen/Screen';
import LoadingDisplay from '../../components/LoadingDisplay';

function Onboarding(props) {
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

Onboarding.propTypes = {
  onFinish: PropTypes.func,
  onStartOnboarding: PropTypes.func
}


Onboarding.defaultProps = {
  onFinish: () => {},
  onStartOnboarding: () => {},
}

export default Onboarding;

