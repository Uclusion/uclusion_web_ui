import React, { useContext, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import { formCommentLink, formMarketLink, navigate } from '../../../utils/marketIdPathFunctions';
import { REPORT_TYPE, TODO_TYPE } from '../../../constants/comments';
import { useHistory } from 'react-router';
import CommentAdd from '../../Comments/CommentAdd';
import { getPageReducerPage, usePageStateReducer } from '../../PageState/pageStateHooks';
import { getFullStage, isInReviewStage, isNotDoingStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { stageChangeInvestible } from '../../../api/investibles';
import { onInvestibleStageChange } from '../../../utils/investibleFunctions';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { getMarketInfo } from '../../../utils/userFunctions';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import CondensedTodos from '../../../pages/Investible/Planning/CondensedTodos';
import { getCommentThreads, getInvestibleComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { isInInbox } from '../../../contexts/NotificationsContext/notificationsContextHelper';
import { findMessagesForInvestibleId } from '../../../utils/messageUtils';
import { deleteOrDehilightMessages } from '../../../api/users';

function StartReviewStep(props) {
  const { marketId, investibleId, groupId, formData = {}, assignId } = props;
  const [investibleState, investiblesDispatch] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [commentAddStateFull, commentAddDispatch] = usePageStateReducer('commentAddStartReview');
  const [commentAddState, updateCommentAddState, commentAddStateReset] =
    getPageReducerPage(commentAddStateFull, commentAddDispatch, investibleId || marketId);
  const classes = useContext(WizardStylesContext);
  const history = useHistory();
  const inv = getInvestible(investibleState, investibleId) || {};
  const info = getMarketInfo(inv, marketId);
  const { stage: movingToStage, clearNotifications } = formData;
  const fullMoveStage = getFullStage(marketStagesState, marketId, movingToStage);
  const investibleComments = getInvestibleComments(investibleId, marketId, commentsState);
  const roots = investibleComments.filter((comment) => comment.comment_type === TODO_TYPE);
  const comments = getCommentThreads(roots, investibleComments);

  function finishMoved(comment) {
    if (comment) {
      navigate(history, formCommentLink(marketId, groupId, investibleId, comment.id));
    } else {
      navigate(history, formMarketLink(marketId, groupId));
    }
  }

  function clearInboxIfRequested() {
    // CloseCommentsStep leaves this clear for a team job, because requiresAction is still true there.
    if (clearNotifications && isInReviewStage(fullMoveStage)) {
      return deleteOrDehilightMessages(findMessagesForInvestibleId(investibleId, messagesState.messages)
        .filter((message) => isInInbox(message)), messagesDispatch, true, false, true);
    }
    return Promise.resolve(true);
  }

  function onSave(comment) {
    // B-all-672: the stage dropdown, or an earlier wizard step, already moved the job.
    if (info?.stage === fullMoveStage.id) {
      return clearInboxIfRequested().then(() => finishMoved(comment));
    }
    if (!comment) {
      setOperationRunning(true);
    }
    const moveInfo = {
      marketId,
      investibleId,
      stageInfo: {
        current_stage_id: info.stage,
        stage_id: fullMoveStage.id,
      },
    };
    if (assignId) {
      moveInfo.stageInfo.assignments = [assignId];
    }
    const fullCurrentStage = getFullStage(marketStagesState, marketId, info.stage)
    return stageChangeInvestible(moveInfo)
      .then((newInv) => {
        onInvestibleStageChange(fullMoveStage.id, newInv, investibleId, marketId, commentsState,
          commentsDispatch, investiblesDispatch, () => {}, marketStagesState, undefined,
          fullCurrentStage, marketPresencesDispatch);
        return clearInboxIfRequested().then(() => finishMoved(comment));
      })
      .finally(() => setOperationRunning(false));
  }

  // C-all-2248: do not ask what finished. A leftover review link still moves the job and leaves.
  const startedReviewFinish = useRef(false);
  const finishingReview = Boolean(fullMoveStage) && isInReviewStage(fullMoveStage)
    && !isNotDoingStage(fullMoveStage);
  useEffect(() => {
    if (!finishingReview || startedReviewFinish.current) {
      return;
    }
    startedReviewFinish.current = true;
    onSave();
  }, [finishingReview]);
  if (finishingReview) {
    return React.Fragment;
  }

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
      <Typography className={classes.introText} style={{marginBottom: 'unset'}}>
        Why are you not doing?
      </Typography>
      <CondensedTodos comments={roots} investibleComments={comments} isInbox marketId={marketId} hideTabs
                      defaultToOpenComments={false} />
      <CommentAdd
        nameKey="CommentAddStartReview"
        type={REPORT_TYPE}
        wizardProps={{...props, showTerminate: true, isAddWizard: true, onTerminate: () => onSave()}}
        commentAddState={commentAddState}
        updateCommentAddState={updateCommentAddState}
        commentAddStateReset={commentAddStateReset}
        marketId={marketId}
        groupId={groupId}
        fromInvestibleId={investibleId}
        onSave={onSave}
        nameDifferentiator="startReview"
      />
    </WizardStepContainer>
  );
}

StartReviewStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

export default StartReviewStep;
