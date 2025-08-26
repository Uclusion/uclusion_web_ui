import React from 'react';
import WorkspaceInviteStep from './WorkspaceInviteStep';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import DemoInviteStep from './DemoInviteStep';

function WorkspaceInviteWizard(props) {
  const { marketId, isDemo } = props;
  if (!marketId) {
    return React.Fragment;
  }
  return (
    <WizardStylesProvider>
      <FormdataWizard useLocalStorage={false} name="workspace_invite_wizard">
        {isDemo && (
          <DemoInviteStep marketId={marketId} />
        )}
        {!isDemo && (
          <WorkspaceInviteStep marketId={marketId} />
        )}
      </FormdataWizard>
    </WizardStylesProvider>
  )
}

export default WorkspaceInviteWizard

