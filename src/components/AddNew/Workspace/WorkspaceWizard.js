import React from 'react'
import PropTypes from 'prop-types'
import WorkspaceNameStep from './WorkspaceNameStep'
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import WorkspaceMembersStep from './WorkspaceMemberStep'
import { getUclusionLocalStorageItem, setUclusionLocalStorageItem } from '../../localStorageUtils';
import WorkspaceGroupNameStep from './WorkspaceGroupNameStep'

function WorkspaceWizard(props) {
  const {onboarding, onFinish, onStartOnboarding} = props;

  // figure out what step we're on
  // if we've created the workspace already, then we're on step 2, otherwise 1
  const workspaceCreated = getUclusionLocalStorageItem("workspace_created") === true;
  const startStep = workspaceCreated? 1 : 0;

  const myOnFinish = () => {
    console.dir("finished!");
    setUclusionLocalStorageItem("workspace_created", false);
    onFinish();
  }

  return (
    <WizardStylesProvider>
      <FormdataWizard name="workpsace_wizard"
                      startStep={startStep}
                      onFinish={myOnFinish}>
        <WorkspaceNameStep onboarding={onboarding} onStartOnboarding={onStartOnboarding}/>
        <WorkspaceGroupNameStep onboarding={onboarding} onStartOnboarding={onStartOnboarding}/>
        <WorkspaceMembersStep onboarding={onboarding}/>
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

WorkspaceWizard.propTypes = {
  onboarding: PropTypes.bool,
  onFinish: PropTypes.func,
  onStartOnboarding: PropTypes.func,
};

WorkspaceWizard.defaultProps = {
  onboarding: false,
  onFinish: () => {},
  onStartOnboarding: () => {},  
}

export default WorkspaceWizard;

