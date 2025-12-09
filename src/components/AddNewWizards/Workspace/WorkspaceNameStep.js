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

function WorkspaceNameStep (props) {
  const { updateFormData, formData, createWorkspace, nextStep } = props;
  const value = formData.name || '';
  const validForm = !_.isEmpty(value);
  const classes = useContext(WizardStylesContext);
  const [userState] = useContext(AccountContext);
  const isDemoOn = userState?.user?.onboarding_state !== OnboardingState.FirstMarketJoined;

  function onNameChange (event) {
    const { value } = event.target;
    updateFormData({
      name: value
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
            A workspace must have at least one view to organize and control who is notified by default.
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
        <div className={classes.borderBottom}/>
        <WizardStepButtons
          {...props}
          onNext={() => {
            updateFormData({ groupType: 'AUTONOMOUS' })
            return createWorkspace(formData);
          }}
          nextLabel='singlePersonView'
          validForm={validForm}
          showOtherNext
          otherNextLabel='everyoneView'
          onOtherNext={() => updateFormData({ groupType: 'EVERYONE' })}
          showTerminate
          terminateLabel='teamView'
          onTerminate={() => {
            updateFormData({ groupType: 'TEAM' })
            return nextStep();
          }}
        />
      </div>
    </WizardStepContainer>
  );
}

WorkspaceNameStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

WorkspaceNameStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default WorkspaceNameStep;