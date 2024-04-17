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
import { navigateToOption } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';

function OptionUnlockStep (props) {
  const { marketId, investible, onFinishUnlock, parentComment } = props;
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const classes = useContext(WizardStylesContext);
  const history = useHistory();
  const { locked_by: lockedBy, updated_at: updatedAt, id: investibleId } = investible || {};

  function breakLock() {
    return lockInvestibleForEdit(marketId, investibleId, true)
      .then((result) => {
        onFinishUnlock();
        setOperationRunning(false);
        refreshInvestibles(investiblesDispatch, diffDispatch, [result]);
      });
  }

  return (
    <WizardStepContainer
      {...props}
    >
        <Typography className={classes.introText} variant="h6">
          Unlock this option?
        </Typography>
        <Typography className={classes.introSubText} variant="subtitle1">
          This option was locked by locked by {lockedBy} <UsefulRelativeTime value={updatedAt}/>
        </Typography>
        <div className={classes.borderBottom}/>
        <WizardStepButtons
          {...props}
          nextLabel="breakLock"
          onNext={breakLock}
          showTerminate
          onTerminate={() => navigateToOption(history, parentComment.market_id, parentComment.investible_id,
            parentComment.group_id, investibleId)}
          terminateLabel="OnboardingWizardGoBack"
        />
    </WizardStepContainer>
  )
}

OptionUnlockStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
}

OptionUnlockStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
}

export default OptionUnlockStep