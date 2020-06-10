import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import OnboardingWizard from '../OnboardingWizard';
import { useIntl } from 'react-intl';
import WhatDoYouWantToDoStep from './WhatDoYouWantToDoStep';
import StoryWorkspaceWizard from './Workspace/StoryWorkspace/StoryWorkspaceWizard';
import RequirementsWorkspaceWizard from './Workspace/RequirementsWorkspace/RequirementsWorkspaceWizard';
import DialogWizard from './Dialog/DialogWizard';
import InitiativeWizard from './Initiative/InitiativeWizard';

function SignupWizard(props) {

  const { hidden } = props;
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
      content: <WhatDoYouWantToDoStep setWizardToShow={setWizardToShow}/>
    },
  ];

  switch (wizardToShow) {
    case 'storyWorkspace':
      return <StoryWorkspaceWizard onStartOver={onStartOver} hidden={hidden} />
    case 'requirementsWorkspace':
      return <RequirementsWorkspaceWizard onStartOver={onStartOver} hidden={hidden}/>
    case 'dialog':
      return <DialogWizard onStartOver={onStartOver} hidden={hidden}/>
    case 'initiative':
      return <InitiativeWizard onStartOver={onStartOver} hidden={hidden}/>
    default:
      return (
        <OnboardingWizard
          hidden={hidden}
          hideSteppers
          onStartOver={onStartOver}
          title={intl.formatMessage({ id: 'SignupWizardTitle'})}
          stepPrototypes={stepPrototypes}
        />
      );
  }
}

SignupWizard.propTypes = {
  hidden: PropTypes.bool.isRequired,
}

export default SignupWizard;