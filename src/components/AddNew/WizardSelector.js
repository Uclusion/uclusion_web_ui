import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types'
import WhatDoYouWantToDo from './WhatDoYouWantToDo'
import StoryWorkspaceWizard from './Workspace/StoryWorkspace/StoryWorkspaceWizard'
import RequirementsWorkspaceWizard
  from './Workspace/RequirementsWorkspace/RequirementsWorkspaceWizard'
import DialogWizard from './Dialog/DialogWizard'
import InitiativeWizard from './Initiative/InitiativeWizard'
import { Clear } from '@material-ui/icons'
import SpinningIconLabelButton from '../Buttons/SpinningIconLabelButton'
import { useIntl } from 'react-intl'

function WizardSelector(props) {

  const { hidden, onFinish, onCancel } = props;
  const intl = useIntl();
  const [wizardToShow, setWizardToShow] = useState(null);

  function getWizardToShow() {
    switch (wizardToShow) {
      case 'storyWorkspace':
        return <StoryWorkspaceWizard onStartOver={onStartOver} onFinish={onFinish} isHome/>
      case 'requirementsWorkspace':
        return <RequirementsWorkspaceWizard onStartOver={onStartOver} onFinish={onFinish} isHome/>
      case 'dialog':
        return <DialogWizard onStartOver={onStartOver} onFinish={onFinish} isHome/>
      case 'initiative':
        return <InitiativeWizard onStartOver={onStartOver} onFinish={onFinish} isHome/>
      default:
        return <WhatDoYouWantToDo setWizardToShow={setWizardToShow}/>
    }
  }

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

  const resolvedWizard = getWizardToShow();
  return (
    <div style={{display: 'flex', justifyContent: 'center', paddingBottom: '3rem', width: '100%'}}>
      <div>
        {resolvedWizard}
      </div>
      <div style={{maxHeight: '1rem', paddingLeft: '3rem'}}>
        <SpinningIconLabelButton onClick={onCancel} doSpin={false} icon={Clear}>
          {intl.formatMessage({ id: 'cancel' })}
        </SpinningIconLabelButton>
      </div>
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