import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import InstallSelector, { INSTALL_CLIENTS } from '../../../pages/About/InstallSelector';
import { getSecret } from '../../../api/users';
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';

// C-all-1505: an invited user's onboarding is AI first too, so offer the connect commands
// for the workspace they just joined before the navigation tour
function ConnectInvitedStep(props) {
  const { updateFormData = () => {}, formData = {}, marketId, nextStep } = props;
  const classes = useContext(WizardStylesContext);
  const [marketsState] = useContext(MarketsContext);
  const market = getMarket(marketsState, marketId) || {};
  const installScope = formData.installScope || 'global';
  const installClients = formData.installClients || INSTALL_CLIENTS.map((client) => client.key);
  const tokenAudit = formData.tokenAudit || false;

  function onGenerate() {
    return getSecret(marketId).then((secretUser) => {
      updateFormData({
        marketId,
        secretUser
      });
      return secretUser;
    });
  }

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
      <Typography className={classes.introText}>
        Connect your AI to {market.name || 'this workspace'} first?
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        Generate builds the commands that hook Uclusion up to your AI coding tools for this
        workspace. Once connected, the AI can help you get set up, including a view of your own.
      </Typography>
      <InstallSelector scope={installScope} setScope={(scope) => updateFormData({ installScope: scope })}
                       clients={installClients}
                       setClients={(clients) => updateFormData({ installClients: clients })}
                       tokenAudit={tokenAudit}
                       setTokenAudit={(audit) => updateFormData({ tokenAudit: audit })} />
      <div className={classes.borderBottom}/>
      <WizardStepButtons
        {...props}
        nextLabel='generateAIConnect'
        onNext={onGenerate}
        showTerminate
        terminateLabel='skipAIOnly'
        onTerminate={() => nextStep(2)}
      />
    </WizardStepContainer>
  );
}

ConnectInvitedStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

export default ConnectInvitedStep;
