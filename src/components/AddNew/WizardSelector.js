import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types'
import WhatDoYouWantToDo from './WhatDoYouWantToDo'
import StoryWorkspaceWizard from './Workspace/StoryWorkspace/StoryWorkspaceWizard'
import RequirementsWorkspaceWizard
  from './Workspace/RequirementsWorkspace/RequirementsWorkspaceWizard'
import DialogWizard from './Dialog/DialogWizard'
import InitiativeWizard from './Initiative/InitiativeWizard'

function WizardSelector(props) {

  const { hidden, onFinish } = props;

  const [wizardToShow, setWizardToShow] = useState(null);


  useEffect(() => {
    if (wizardToShow && hidden) {
      setWizardToShow(null);
    }
  }, [hidden, setWizardToShow, wizardToShow]);

  function onStartOver() {
    setWizardToShow(null);
  }

  if (hidden) {
    return <React.Fragment/>
  }


  switch (wizardToShow) {
    case 'storyWorkspace':
      return <StoryWorkspaceWizard onStartOver={onStartOver} onFinish={onFinish} isHome />
    case 'requirementsWorkspace':
      return <RequirementsWorkspaceWizard onStartOver={onStartOver} onFinish={onFinish} isHome />
    case 'dialog':
      return <DialogWizard onStartOver={onStartOver} onFinish={onFinish} isHome />
    case 'initiative':
      return <InitiativeWizard onStartOver={onStartOver} onFinish={onFinish} isHome />
    default:
      return <WhatDoYouWantToDo setWizardToShow={setWizardToShow} />
  }
}

WizardSelector.propTypes = {
  hidden: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onFinish: PropTypes.func,
}

WizardSelector.defaultProps = {
  onFinish: () => {},
};
export default WizardSelector;