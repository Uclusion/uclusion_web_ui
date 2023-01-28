import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext'
import WizardStepButtons from '../WizardStepButtons';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { useHistory } from 'react-router'
import { formInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import JobDescription from '../JobDescription'
import { stageChangeInvestible } from '../../../api/investibles';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import {
  getAcceptedStage,
  getInCurrentVotingStage,
  getInReviewStage, getVerifiedStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { useIntl } from 'react-intl';
import { onInvestibleStageChange } from '../../../utils/investibleFunctions';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { getCommentsSortedByType } from '../../../utils/commentFunctions';
import _ from 'lodash'
import { getPageReducerPage, usePageStateReducer } from '../../PageState/pageStateHooks';

function DecideStageStep(props) {
  const { marketId, investibleId, currentStageId } = props;
  const intl = useIntl();
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [, invDispatch] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const marketComments = getMarketComments(commentsState, marketId);
  const comments = getCommentsSortedByType(marketComments, investibleId, false);
  const history = useHistory();
  const classes = wizardStyles();
  const acceptedStage = getAcceptedStage(marketStagesState, marketId) || {};
  const inReviewStage = getInReviewStage(marketStagesState, marketId) || {};
  const inVotingStage = getInCurrentVotingStage(marketStagesState, marketId) || {};
  const verifiedStage = getVerifiedStage(marketStagesState, marketId) || {};
  const [pageStateFull, pageDispatch] = usePageStateReducer('investible');
  const [, updatePageState] = getPageReducerPage(pageStateFull, pageDispatch, investibleId,
    {sectionOpen: 'descriptionVotingSection'});
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
          invDispatch, () => {}, marketStagesState, undefined, aStage);
        setOperationRunning(false);
        if (isGotoJob) {
          navigate(history, formInvestibleLink(marketId, investibleId));
        }
      });
  }
  function moveToTarget(isGotoJob) {
    return moveToStage(destinationStage, isGotoJob);
  }
  let onOtherNextFunc = () => moveToTarget(true);
  let otherNextLabelId = 'stageAndGotoJob';
  let nextLabelId = 'DecideStageMove';
  let onNextFunc = () => moveToTarget(false);
  if (currentStageId === inVotingStage.id) {
    destinationStage = acceptedStage;
    destinationExplanation = 'planningInvestibleAcceptedExplanation';
    destinationLabel = 'planningInvestibleNextStageAcceptedLabel';
    otherNextLabelId = 'commentIconAskQuestionLabel';
    onOtherNextFunc = () => {
      updatePageState({sectionOpen: 'questionsSection'});
      navigate(history, formInvestibleLink(marketId, investibleId));
    };
    nextLabelId = 'startJob';
  } else if (currentStageId === acceptedStage.id) {
    destinationStage = inReviewStage;
    destinationLabel = 'planningInvestibleNextStageInReviewLabel';
    destinationExplanation = 'planningInvestibleInReviewExplanation';
    otherNextLabelId='modifyTasks';
    onOtherNextFunc = () => {
      updatePageState({sectionOpen: 'tasksSection'});
      navigate(history, formInvestibleLink(marketId, investibleId));
    };
    onNextFunc = undefined;
    nextLabelId='startReview';
  } else if (currentStageId === inReviewStage.id) {
    if (!_.isEmpty(comments)) {
      destinationStage = acceptedStage;
      destinationExplanation = 'planningInvestibleTasksInReviewExplanation';
      destinationLabel = 'planningInvestibleNextStageAcceptedLabel';
    } else {
      otherNextLabelId = 'planningInvestibleMoveToAcceptedLabel';
      onOtherNextFunc = () => moveToStage(acceptedStage, true);
      destinationStage = verifiedStage;
      destinationLabel = 'planningInvestibleMoveToVerifiedLabel';
      destinationExplanation = 'planningInvestibleVerifiedExplanation';
    }
  }

  if (!destinationLabel) {
    return React.Fragment;
  }

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText}>
        Move this job to {intl.formatMessage({ id: destinationLabel })}?
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        {intl.formatMessage({ id: destinationExplanation })}.
      </Typography>
      <JobDescription marketId={marketId} investibleId={investibleId} comments={comments} />
      <WizardStepButtons
        {...props}
        nextLabel={nextLabelId}
        onNext={onNextFunc}
        showOtherNext
        onOtherNext={onOtherNextFunc}
        otherNextLabel={otherNextLabelId}
        showTerminate
        terminateLabel="JobWizardGotoJob"
        onFinish={() => navigate(history, formInvestibleLink(marketId, investibleId))}
      />
    </div>
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