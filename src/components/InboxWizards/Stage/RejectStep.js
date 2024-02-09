import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { useHistory } from 'react-router';
import { formInvestibleLink, formWizardLink, navigate } from '../../../utils/marketIdPathFunctions';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import JobDescription from '../JobDescription';
import { stageChangeInvestible } from '../../../api/investibles';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { getFurtherWorkStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { useIntl } from 'react-intl';
import { onInvestibleStageChange } from '../../../utils/investibleFunctions';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { JOB_ASSIGNEE_WIZARD_TYPE } from '../../../constants/markets';

function RejectStep(props) {
  const { marketId, investibleId, currentStageId, typeObjectId } = props;
  const intl = useIntl();
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [, invDispatch] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [,marketPresencesDispatch] = useContext(MarketPresencesContext);
  const history = useHistory();
  const classes = wizardStyles();
  const backlogStage = getFurtherWorkStage(marketStagesState, marketId)

  function moveToStage(aStage, readyToStart) {
    const moveInfo = {
      marketId,
      investibleId,
      stageInfo: {
        current_stage_id: currentStageId,
        stage_id: aStage.id,
        open_for_investment: readyToStart
      },
    };
    return stageChangeInvestible(moveInfo)
      .then((newInv) => {
        onInvestibleStageChange(aStage.id, newInv, investibleId, marketId, commentsState, commentsDispatch,
          invDispatch, () => {}, marketStagesState, undefined, aStage, marketPresencesDispatch);
        setOperationRunning(false);
        navigate(history, `${formInvestibleLink(marketId, investibleId)}#start`);
      });
  }

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        {intl.formatMessage({ id: 'rejectAssignmentQ' })}
      </Typography>
      <JobDescription marketId={marketId} investibleId={investibleId} removeActions/>
      <div className={classes.marginBottom}/>
      <WizardStepButtons
        {...props}
        nextLabel="DecideWizardReassign"
        spinOnClick={false}
        onNext={() => navigate(history, formWizardLink(JOB_ASSIGNEE_WIZARD_TYPE, marketId, investibleId,
          undefined, undefined, typeObjectId))}
        showOtherNext
        onOtherNext={() => moveToStage(backlogStage, true)}
        otherNextLabel="backlogReadyToStart"
        showTerminate
        terminateLabel="backlogNotReadyToStart"
        terminateSpinOnClick
        onFinish={() => moveToStage(backlogStage, false)}
      />
    </WizardStepContainer>
  );
}

RejectStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

RejectStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default RejectStep;