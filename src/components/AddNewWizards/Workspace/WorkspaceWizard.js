import React, { useContext } from 'react';
import PropTypes from 'prop-types'
import WorkspaceNameStep from './WorkspaceNameStep'
import { WizardStylesProvider } from '../WizardStylesContext'
import FormdataWizard from 'react-formdata-wizard'
import WorkspaceMembersStep from './WorkspaceMemberStep'
import { getUclusionLocalStorageItem, setUclusionLocalStorageItem } from '../../localStorageUtils'
import { navigate } from '../../../utils/marketIdPathFunctions';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { useHistory } from 'react-router';

function WorkspaceWizard (props) {
  const { onboarding, setInOnboarding } = props
  const history = useHistory();
  const [, setOperationRunning] = useContext(OperationInProgressContext);


  // figure out what step we're on
  // if we've created the workspace already, then we're on step 2, otherwise 1
  const workspaceCreated = getUclusionLocalStorageItem('workspace_created') === true
  const startStep = workspaceCreated ? 1 : 0

  const myOnFinish = (formData) => {
    setInOnboarding(false);
    setUclusionLocalStorageItem('workspace_created', false)
    const { link } = formData;
    console.debug(`link is ${link}`)
    setOperationRunning(false);
    navigate(history, link);
  }

  function onStartOnboarding() {
    setInOnboarding(true);
  }

  return (
    <WizardStylesProvider>
      <FormdataWizard
        name="workpsace_wizard"
        startStep={startStep}
        onFinish={myOnFinish}
      >
        <WorkspaceNameStep onboarding={onboarding} onStartOnboarding={onStartOnboarding}/>
        <WorkspaceMembersStep onboarding={onboarding}/>
      </FormdataWizard>
    </WizardStylesProvider>
  )
}

WorkspaceWizard.propTypes = {
  onboarding: PropTypes.bool,
  setInOnboarding: PropTypes.func,
}

WorkspaceWizard.defaultProps = {
  onboarding: false,
  setInOnboarding: () => {},
}

export default WorkspaceWizard

