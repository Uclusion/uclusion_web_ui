import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types'
import OnboardingWizard from '../../Onboarding/OnboardingWizard'
import { useIntl } from 'react-intl'
import WhatDoYouWantToDoStep from './WhatDoYouWantToDoStep'
import StoryWorkspaceWizard from '../../Onboarding/SignupOnboarding/Workspace/StoryWorkspace/StoryWorkspaceWizard'
import RequirementsWorkspaceWizard
  from '../../Onboarding/SignupOnboarding/Workspace/RequirementsWorkspace/RequirementsWorkspaceWizard'
import DialogWizard from '../../Onboarding/SignupOnboarding/Dialog/DialogWizard'
import InitiativeWizard from '../../Onboarding/SignupOnboarding/Initiative/InitiativeWizard'

function AddNewWizard(props) {

  const { hidden, onFinish } = props;
  const intl = useIntl();

  const [wizardToShow, setWizardToShow] = useState(null);


  useEffect(() => {
    if (wizardToShow && hidden) {
      setWizardToShow(null);
    }
  }, [hidden, setWizardToShow, wizardToShow]);

  function onStartOver() {
    setWizardToShow(null);
  }

  const stepPrototypes = [
    {
      label: 'SignupWizardTitle',
      content: <WhatDoYouWantToDoStep setWizardToShow={setWizardToShow} />
    },
  ];

  switch (wizardToShow) {
    case 'storyWorkspace':
      return <StoryWorkspaceWizard onStartOver={onStartOver} hidden={hidden} onFinish={onFinish} isHome />
    case 'requirementsWorkspace':
      return <RequirementsWorkspaceWizard onStartOver={onStartOver} hidden={hidden} onFinish={onFinish} isHome />
    case 'dialog':
      return <DialogWizard onStartOver={onStartOver} hidden={hidden} onFinish={onFinish} isHome />
    case 'initiative':
      return <InitiativeWizard onStartOver={onStartOver} hidden={hidden} onFinish={onFinish} isHome />
    default:
      return (
        <OnboardingWizard
          hidden={hidden}
          isHome
          hideSteppers
          onFinish={onFinish}
          onStartOver={onStartOver}
          title={intl.formatMessage({ id: 'SignupWizardTitle'})}
          stepPrototypes={stepPrototypes}
        />
      );
  }
}

AddNewWizard.propTypes = {
  hidden: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onFinish: PropTypes.func,
}

AddNewWizard.defaultProps = {
  onFinish: () => {},
};
export default AddNewWizard;