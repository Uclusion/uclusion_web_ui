import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types'
import WhatDoYouWantToDo from './WhatDoYouWantToDo'
import StoryWorkspaceWizard from './Workspace/StoryWorkspace/StoryWorkspaceWizard'
import DialogWizard from './Dialog/DialogWizard'
import InitiativeWizard from './Initiative/InitiativeWizard'
import { WizardStylesProvider } from './WizardStylesContext'

function WizardSelector(props) {
  const { hidden, onFinish, onCancel, showCancel } = props;
  const [wizardToShow, setWizardToShow] = useState(null);

  function onStartOver() {
    setWizardToShow(null);
    onCancel();
  }

  function getWizardToShow() {
    if (!showCancel) {
      // This is onboarding and they have nothing so force Workspace creation
      return <StoryWorkspaceWizard onStartOver={onStartOver} onFinish={onFinish} isHome showCancel={false}/>
    }
    switch (wizardToShow) {
      case 'storyWorkspace':
        return <StoryWorkspaceWizard onStartOver={onStartOver} onFinish={onFinish} isHome/>
      case 'dialog':
        return <DialogWizard onStartOver={onStartOver} onFinish={onFinish} isHome/>
      case 'initiative':
        return <InitiativeWizard onStartOver={onStartOver} onFinish={onFinish} isHome/>
      default:
        return (<WizardStylesProvider>
          <WhatDoYouWantToDo setWizardToShow={setWizardToShow} onStartOver={onStartOver} showCancel={showCancel}/>
        </WizardStylesProvider>)
    }
  }

  useEffect(() => {
    if (wizardToShow && hidden) {
      setWizardToShow(null);
    }
  }, [hidden, setWizardToShow, wizardToShow]);

  if (hidden) {
    return <React.Fragment/>
  }

  const resolvedWizard = getWizardToShow();
  return (
    <div style={{display: 'flex', justifyContent: 'center', paddingBottom: '3rem', width: '100%'}}>
      {resolvedWizard}
    </div>
  );
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