import React from 'react'
import PropTypes from 'prop-types'
import WorkspaceNameStep from './WorkspaceNameStep'
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import WorkspaceMembersStep from './WorkspaceMemberStep'
import { getUclusionLocalStorageItem, setUclusionLocalStorageItem } from '../../localStorageUtils';


function WorkspaceWizard(props) {
  const {onboarding, onFinish} = props;

  // figure out what step we're on
  // if we've created the workspace already, then we're on step 2, otherwise 1
  const workspaceCreated = getUclusionLocalStorageItem("workspace_created") === true;
  const startStep = workspaceCreated? 1 : 0;

  const myOnFinish = () => {
    setUclusionLocalStorageItem("workspace_created", false);
    onFinish();
  }

  return (
    <WizardStylesProvider>
      <FormdataWizard name="workspace_wizard" startStep={startStep} onFinish={myOnFinish}>
        <WorkspaceNameStep onboarding={onboarding}/>
        <WorkspaceMembersStep onboarding={onboarding}/>
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

WorkspaceWizard.propTypes = {
  onboarding: PropTypes.bool,
  onFinish: PropTypes.func,
};

WorkspaceWizard.defaultProps = {
  onboarding: false,
  onFinish: () => {},
}

export default WorkspaceWizard;

