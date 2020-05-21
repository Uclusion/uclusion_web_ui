import React, { useState } from 'react';
import PropTypes from 'prop-types';
import OnboardingWizard from '../OnboardingWizard';
import { useIntl } from 'react-intl';
import WhatDoYouWantToDoStep from './WhatDoYouWantToDoStep';
import WorkspaceWizard from '../WorkspaceOnboarding/WorkspaceWizard';
import DialogWizard from '../DialogOnboarding/DialogWizard';
import InitiativeWizard from '../InitiativeOnboarding/InitiativeWizard';

function SignupWizard(props) {

  const { hidden } = props;
  const intl = useIntl();

  const [wizardToShow, setWizardToShow] = useState(null);

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
    case 'workspace':
      return <WorkspaceWizard onStartOver={onStartOver} hidden={hidden} />
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