import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { formMarketLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import config from '../../../config';
import CopyCommand from '../../../pages/About/CopyCommand';
import { buildInstallArgs, getUclusionEnvironment } from '../../../pages/About/installUtils';
import StartWorkingInstructions from '../../../pages/About/StartWorkingInstructions';
import { INSTALL_CLIENTS } from '../../../pages/About/InstallSelector';

// J-all-400: after Generate the workspace exists, so show the same three copy-paste steps as
// the Integrations page but with the credentials already fetched
function ConnectAIInstallStep(props) {
  const { formData = {} } = props;
  const classes = useContext(WizardStylesContext);
  const history = useHistory();
  const { marketId, secretUser } = formData;
  const installScope = formData.installScope || 'global';
  const installClients = formData.installClients || INSTALL_CLIENTS.map((client) => client.key);
  const tokenAudit = formData.tokenAudit || false;
  const env = getUclusionEnvironment();
  const credentialsFile = env === 'production' ? 'credentials' : `${env}_credentials`;
  const installBaseUrl = config.ui_base_url;
  // The new workspace's default view has the same id as the workspace
  const installArgs = buildInstallArgs(marketId, marketId, env, installClients, installScope, tokenAudit);

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
      <Typography className={classes.introText}>
        Your workspace is ready to connect AI
      </Typography>
      <Typography variant="h6" style={{paddingBottom: '0.5rem'}}>
        Step 1. Copy and run this command to install your credentials
      </Typography>
      {secretUser && (
        <CopyCommand
          command={`mkdir -p ~/.uclusion && cat > ~/.uclusion/${credentialsFile} <<'EOF'\nsecret_key_id = ${secretUser.external_id}_${secretUser.account_id}\nsecret_key = ${secretUser.client_secret}\nEOF`}
        />
      )}
      <Typography variant="h6" style={{paddingTop: '1.5rem', paddingBottom: '0.5rem'}}>
        Step 2. Copy and run the install command
      </Typography>
      {installScope === 'project' && (
        <Typography variant="subtitle1" style={{paddingBottom: '0.5rem'}}>
          Run this from your project's root directory. It configures the directory it runs in.
        </Typography>
      )}
      <CopyCommand
        command={`curl -fsSL ${installBaseUrl}/scripts/install.sh | bash -s -- ${installArgs}`}
      />
      <Typography variant="h6" style={{paddingTop: '1.5rem', paddingBottom: '0.5rem'}}>
        Step 3. Start working inside your AI tool
      </Typography>
      <StartWorkingInstructions />
      <div className={classes.borderBottom}/>
      <WizardStepButtons
        {...props}
        showNext={false}
        showTerminate
        terminateLabel='goToNewWorkspace'
        onTerminate={() => navigate(history, formMarketLink(marketId, marketId))}
      />
    </WizardStepContainer>
  );
}

ConnectAIInstallStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

export default ConnectAIInstallStep;
