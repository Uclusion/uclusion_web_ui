import React from 'react';
import WorkspaceInviteStep from './WorkspaceInviteStep';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';

function WorkspaceInviteWizard(props) {
  const { marketId } = props;
  return (
    <WizardStylesProvider>
      <FormdataWizard
        useLocalStorage={false}
        name="workspace_invite_wizard"
      >
        <WorkspaceInviteStep marketId={marketId} />
      </FormdataWizard>
    </WizardStylesProvider>
  )
}

export default WorkspaceInviteWizard

