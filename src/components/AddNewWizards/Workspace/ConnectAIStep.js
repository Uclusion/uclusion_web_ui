import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { InputAdornment, OutlinedInput, Typography } from '@material-ui/core';
import _ from 'lodash';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { AccountContext } from '../../../contexts/AccountContext/AccountContext';
import { NAME_MAX_LENGTH } from '../../TextFields/NameField';
import { OnboardingState } from '../../../contexts/AccountContext/accountUserContextHelper';
import InstallSelector, { INSTALL_CLIENTS } from '../../../pages/About/InstallSelector';
import { getSecret } from '../../../api/users';

// J-all-400: Connect AI creates the workspace with a single person view (Q-all-429) - the AI
// asks about view setup and collaborators after connecting, so the UI does not ask here
function ConnectAIStep(props) {
  const { updateFormData = () => {}, formData = {}, createWorkspace } = props;
  const value = formData.name || '';
  const validForm = !_.isEmpty(value);
  const classes = useContext(WizardStylesContext);
  const [userState] = useContext(AccountContext);
  const isDemoOn = userState?.user?.onboarding_state === OnboardingState.DemoCreated;
  const installScope = formData.installScope || 'global';
  const installClients = formData.installClients || INSTALL_CLIENTS.map((client) => client.key);
  const tokenAudit = formData.tokenAudit || false;
  const workClaims = formData.workClaims || false;

  function onNameChange(event) {
    const { value } = event.target;
    updateFormData({
      name: value
    });
  }

  function onGenerate() {
    return createWorkspace({ ...formData, groupType: 'AUTONOMOUS' }, false)
      .then((market) => {
        return getSecret(market.id).then((secretUser) => {
          updateFormData({
            marketId: market.id,
            secretUser
          });
          return market;
        });
      });
  }

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
      <div>
        <Typography className={classes.introText}>
          What do you want to call your workspace?
        </Typography>
        <Typography className={classes.introSubText} variant="subtitle1">
          Generate creates the workspace and your AI setup commands. The AI helps with view setup
          and collaborators once connected.
        </Typography>
        {isDemoOn && (
          <Typography className={classes.introSubText} variant="subtitle1">
            <b>Warning</b>: Creating this workspace <i>ends all demos</i> and removes their workspaces.
          </Typography>
        )}
        <OutlinedInput
          id="workspaceName"
          className={classes.input}
          style={{maxWidth: '25rem'}}
          value={value}
          onChange={onNameChange}
          autoFocus
          placeholder="Ex: ACME Corp"
          variant="outlined"
          inputProps={{ maxLength : NAME_MAX_LENGTH }}
          endAdornment={
            <InputAdornment position={'end'} style={{ marginRight: '1rem' }}>
              {NAME_MAX_LENGTH - (formData?.name?.length ?? 0)}
            </InputAdornment>
          }
        />
        <div style={{marginTop: '1.5rem'}}>
          <InstallSelector scope={installScope} setScope={(scope) => updateFormData({ installScope: scope })}
                           clients={installClients}
                           setClients={(clients) => updateFormData({ installClients: clients })}
                           tokenAudit={tokenAudit}
                           setTokenAudit={(audit) => updateFormData({ tokenAudit: audit })}
                           workClaims={workClaims}
                           setWorkClaims={(claims) => updateFormData({ workClaims: claims })} />
        </div>
        <div className={classes.borderBottom}/>
        <WizardStepButtons
          {...props}
          nextLabel='generateAIConnect'
          onNext={onGenerate}
          validForm={validForm}
        />
      </div>
    </WizardStepContainer>
  );
}

ConnectAIStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

export default ConnectAIStep;
