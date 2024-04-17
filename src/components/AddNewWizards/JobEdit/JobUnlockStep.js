import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import WizardStepButtons from '../WizardStepButtons';
import { WizardStylesContext } from '../WizardStylesContext';
import UsefulRelativeTime from '../../TextFields/UseRelativeTime';
import { lockInvestibleForEdit } from '../../../api/investibles';
import { refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { DiffContext } from '../../../contexts/DiffContext/DiffContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { formInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { usePresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';

function JobUnlockStep (props) {
  const { marketId, investible, onFinishUnlock, totalSteps } = props;
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const classes = useContext(WizardStylesContext);
  const history = useHistory();
  const presences = usePresences(marketId);
  const { locked_by: lockedBy, updated_at: updatedAt, id: investibleId } = investible || {};
  const lockedPresence = presences.find((presence) => presence.id === lockedBy);

  function breakLock() {
    return lockInvestibleForEdit(marketId, investibleId, true)
      .then((result) => {
        if (totalSteps > 1) {
          // If there is only one step means somebody grabbed a lock while we were editing
          onFinishUnlock();
        }
        setOperationRunning(false);
        refreshInvestibles(investiblesDispatch, diffDispatch, [result]);
      });
  }

  return (
    <WizardStepContainer
      {...props}
    >
        <Typography className={classes.introText} variant="h6">
          Unlock this job?
        </Typography>
        <Typography className={classes.introSubText} variant="subtitle1">
          This job was locked by locked by {lockedPresence?.name} <UsefulRelativeTime value={updatedAt}/>
        </Typography>
        <div className={classes.borderBottom}/>
        <WizardStepButtons
          {...props}
          nextLabel="breakLock"
          onNext={breakLock}
          showTerminate
          onTerminate={() => navigate(history, formInvestibleLink(marketId, investibleId))}
          terminateLabel="OnboardingWizardGoBack"
        />
    </WizardStepContainer>
  )
}

JobUnlockStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
}

JobUnlockStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
}

export default JobUnlockStep