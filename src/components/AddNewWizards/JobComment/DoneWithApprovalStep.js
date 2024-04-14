import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { stageChangeInvestible } from '../../../api/investibles';
import { getAcceptedStage, getFullStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { onInvestibleStageChange } from '../../../utils/investibleFunctions';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import JobDescription from '../../InboxWizards/JobDescription';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';

function DoneWithApprovalStep (props) {
  const { marketId, investibleId, currentStageId, onFinishMove } = props;
  const classes = useContext(WizardStylesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [,marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);

  function move() {
    const fullMoveStage = getAcceptedStage(marketStagesState, marketId);
    const fullCurrentStage = getFullStage(marketStagesState, marketId, currentStageId);
    const moveInfo = {
      marketId,
      investibleId,
      stageInfo: {
        current_stage_id: currentStageId,
        stage_id: fullMoveStage.id,
      },
    };
    return stageChangeInvestible(moveInfo)
      .then((newInv) => {
        onInvestibleStageChange(fullMoveStage.id, newInv, investibleId, marketId, commentsState,
          commentsDispatch, investiblesDispatch, () => {}, marketStagesState, undefined,
          fullCurrentStage, marketPresencesDispatch);
        setOperationRunning(false);
        onFinishMove();
      });
  }

  return (
    <WizardStepContainer
      {...props}
    >
        <Typography className={classes.introText} variant="h6">
          Are you done with approval for this job?
        </Typography>
        <Typography className={classes.introSubText} variant="subtitle1">
          Choose 'Move to Approved' to change stage or skip to leave in Assigned.
        </Typography>
        <JobDescription marketId={marketId} investibleId={investibleId} />
        <div className={classes.borderBottom}/>
        <WizardStepButtons
          {...props}
          nextLabel="approvedChangeStage"
          showSkip
          onNext={move}
        />
    </WizardStepContainer>
  )
}

DoneWithApprovalStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
}

DoneWithApprovalStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
}

export default DoneWithApprovalStep