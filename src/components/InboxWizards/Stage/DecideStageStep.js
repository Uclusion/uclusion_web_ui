import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { useHistory } from 'react-router';
import { formInvestibleAddCommentLink, formInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import JobDescription from '../JobDescription';
import { stageChangeInvestible } from '../../../api/investibles';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import {
  getAcceptedStage,
  getInCurrentVotingStage,
  getInReviewStage,
  isAcceptedStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { useIntl } from 'react-intl';
import { onInvestibleStageChange } from '../../../utils/investibleFunctions';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { JOB_COMMENT_WIZARD_TYPE } from '../../../constants/markets';
import { QUESTION_TYPE } from '../../../constants/comments';

function DecideStageStep(props) {
  const { marketId, investibleId, currentStageId } = props;
  const intl = useIntl();
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [, invDispatch] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [,marketPresencesDispatch] = useContext(MarketPresencesContext);
  const history = useHistory();
  const classes = wizardStyles();
  const acceptedStage = getAcceptedStage(marketStagesState, marketId) || {};
  const inReviewStage = getInReviewStage(marketStagesState, marketId) || {};
  const inVotingStage = getInCurrentVotingStage(marketStagesState, marketId) || {};
  let destinationStage;
  let destinationExplanation;
  let destinationLabel;

  function moveToStage(aStage, isGotoJob) {
    const moveInfo = {
      marketId,
      investibleId,
      stageInfo: {
        current_stage_id: currentStageId,
        stage_id: aStage.id,
      },
    };
    return stageChangeInvestible(moveInfo)
      .then((newInv) => {
        onInvestibleStageChange(aStage.id, newInv, investibleId, marketId, commentsState, commentsDispatch,
          invDispatch, () => {}, marketStagesState, undefined, aStage, marketPresencesDispatch);
        setOperationRunning(false);
        if (isGotoJob) {
          if (isAcceptedStage(aStage)) {
            navigate(history, `${formInvestibleLink(marketId, investibleId)}#start`);
          } else {
            navigate(history, formInvestibleLink(marketId, investibleId));
          }
        }
      });
  }
  function moveToTarget(isGotoJob) {
    return moveToStage(destinationStage, isGotoJob);
  }
  let onOtherNextFunc = () => moveToTarget(true);
  let otherNextLabelId = 'stageAndGotoJob';
  let nextLabelId = 'DecideStageMove';
  const isVotingStage = currentStageId === inVotingStage.id;
  if (isVotingStage) {
    destinationStage = acceptedStage;
    destinationExplanation = 'planningInvestibleAcceptedExplanation';
    destinationLabel = 'finishApprovalQ';
    otherNextLabelId = 'commentIconAskQuestionLabel';
    onOtherNextFunc = () => {
      navigate(history,
        formInvestibleAddCommentLink(JOB_COMMENT_WIZARD_TYPE, investibleId, marketId, QUESTION_TYPE));
    };
    nextLabelId = 'startJob';
  }

  // If you start a job and don't go to it hard to find
  const onNextFunc = destinationStage === inReviewStage ? undefined :
    () => moveToTarget(destinationStage === acceptedStage);

  if (!destinationLabel) {
    return React.Fragment;
  }

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        {intl.formatMessage({ id: destinationLabel })}
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        {intl.formatMessage({ id: destinationExplanation })}.
      </Typography>
      <JobDescription marketId={marketId} investibleId={investibleId} removeActions showVoting={isVotingStage} />
      <WizardStepButtons
        {...props}
        nextLabel={nextLabelId}
        onNext={onNextFunc}
        showOtherNext
        onOtherNext={onOtherNextFunc}
        otherSpinOnClick={!isVotingStage}
        otherNextLabel={otherNextLabelId}
      />
    </WizardStepContainer>
  );
}

DecideStageStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

DecideStageStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default DecideStageStep;