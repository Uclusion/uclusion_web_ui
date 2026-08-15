import React, { useContext } from 'react';
import WorkspaceInviteStep from './WorkspaceInviteStep';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import DemoInviteStep from './DemoInviteStep';
import ConnectInvitedStep from './ConnectInvitedStep';
import ConnectAIInstallStep from '../Workspace/ConnectAIInstallStep';
import { getMarket, marketIsDemo } from '../../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';

function WorkspaceInviteWizard(props) {
  const { marketId, isDemo } = props;
  const [marketsState] = useContext(MarketsContext);
  if (!marketId) {
    return React.Fragment;
  }
  // An invite link into a demo market flows through here without the isDemo prop, and demos
  // should not offer AI connection
  const isDemoMarket = isDemo || marketIsDemo(getMarket(marketsState, marketId) || {});
  return (
    <WizardStylesProvider>
      <FormdataWizard useLocalStorage={false} name="workspace_invite_wizard">
        {isDemo && (
          <DemoInviteStep marketId={marketId} />
        )}
        {!isDemo && isDemoMarket && (
          <WorkspaceInviteStep marketId={marketId} />
        )}
        {/* C-all-1505: invited users get AI first onboarding before the navigation tour */}
        {!isDemoMarket && [
          <ConnectInvitedStep key="connectInvited" marketId={marketId} />,
          <ConnectAIInstallStep key="connectInvitedInstall" />,
          <WorkspaceInviteStep key="workspaceInvite" marketId={marketId} />
        ]}
      </FormdataWizard>
    </WizardStylesProvider>
  )
}

export default WorkspaceInviteWizard
