import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import {
  addMarketComments,
  getCommentThreads,
  getMarketComments
} from '../../../contexts/CommentsContext/commentsContextHelper';
import { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE } from '../../../constants/comments';
import _ from 'lodash';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import {
  getFullStage, isFurtherWorkStage,
  isInReviewStage, isNotDoingStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { stageChangeInvestible } from '../../../api/investibles';
import { onInvestibleStageChange } from '../../../utils/investibleFunctions';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { getGroupPresences, getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { GroupMembersContext } from '../../../contexts/GroupMembersContext/GroupMembersContext';

function CloseCommentsStep(props) {
  const { marketId, investibleId, formData, marketInfo, myFinish: finish, isAssign, requiresAction,
    updateFormData, isSingleUser, assignId } = props;
  const classes = useContext(WizardStylesContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [groupPresencesState] = useContext(GroupMembersContext);
  const { assigned: originalAssigned, group_id: groupId, stage: currentStageId } = marketInfo;
  const marketComments = getMarketComments(commentsState, marketId, groupId);
  const unresolvedComments = marketComments.filter(comment => comment.investible_id === investibleId &&
    !comment.resolved);
  const { stage, assigned: newAssigned, useCompression } = formData;
  const assigned = newAssigned || originalAssigned;
  const fullMoveStage = getFullStage(marketStagesState, marketId, stage);
  const fullCurrentStage = getFullStage(marketStagesState, marketId, currentStageId);
  const mustResolveComments = unresolvedComments.filter((comment) =>
    (comment.comment_type === ISSUE_TYPE)||
    (isInReviewStage(fullMoveStage) && comment.comment_type === TODO_TYPE)||
      ([QUESTION_TYPE, SUGGEST_CHANGE_TYPE].includes(comment.comment_type) &&
        ((!assignId && _.isEmpty(assigned))||(assignId ? [assignId] : assigned).includes(comment.created_by))));
  const commentThreads = getCommentThreads(mustResolveComments, marketComments);
  const isMustResolve = fullCurrentStage.move_on_comment ||
    !_.isEmpty(unresolvedComments.filter((comment) => comment.comment_type === TODO_TYPE));
  const isSingleSuggest = _.size(mustResolveComments) === 1 &&
    mustResolveComments[0].comment_type === SUGGEST_CHANGE_TYPE;

  function move(isResolve=true) {
    // Do not rely on async to close the comments cause want this user to be updated by and not auto opened if return
    const moveInfo = {
      marketId,
      investibleId,
      stageInfo: {
        current_stage_id: currentStageId,
        stage_id: stage
      },
    };
    const mustResolveCommentIds = mustResolveComments.map((comment) => comment.id);
    if (isResolve) {
      moveInfo.stageInfo.resolve_comment_ids = mustResolveCommentIds;
    } else {
      moveInfo.stageInfo.task_comment_ids = mustResolveCommentIds;
    }
    if (!_.isEmpty(newAssigned)) {
      moveInfo.stageInfo.assignments = newAssigned;
    } else if (((isSingleUser&&_.isEmpty(assigned))||assignId)&&!isFurtherWorkStage(fullMoveStage)
      &&!isNotDoingStage(fullMoveStage)) {
      const presences = getMarketPresences(marketPresencesState, marketId) || [];
      const groupPresences = getGroupPresences(presences, groupPresencesState, marketId, groupId) || [];
      moveInfo.stageInfo.assignments = assignId ? [assignId] : [groupPresences[0]];
    }
    return stageChangeInvestible(moveInfo)
      .then((response) => {
        const { full_investible: newInv, comments } = response;
        addMarketComments(commentsDispatch, marketId, comments);
        onInvestibleStageChange(stage, newInv, investibleId, marketId, undefined,
          undefined, investiblesDispatch, () => {}, marketStagesState, undefined,
          getFullStage(marketStagesState, marketId, marketInfo.stage));
        setOperationRunning(false);
        finish(fullMoveStage);
      });
  }

  function convert() {
    return move(false);
  }

  if (_.isEmpty(mustResolveComments)) {
    return React.Fragment;
  }

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
      <Typography className={classes.introText}>
        {isMustResolve ? 'Okay that these comments will be resolved?' : 'Will you resolve these comments?'}
      </Typography>
      {isMustResolve && (
        <Typography className={classes.introSubText} variant="subtitle1">
          The below comments will be resolved to change this job's stage.
        </Typography>
      )}
      {!isMustResolve && (
        <Typography className={classes.introSubText} variant="subtitle1">
          The below comments will move this job to assistance.
        </Typography>
      )}
      <div className={classes.wizardCommentBoxDiv}>
        <CommentBox
          comments={commentThreads}
          marketId={marketId}
          allowedTypes={[]}
          isInbox
          compressAll
          inboxMessageId={_.size(mustResolveComments) === 1 ? mustResolveComments[0].id : undefined}
          removeActions
          toggleCompression={() => updateFormData({useCompression: !useCompression})}
          useCompression={useCompression}
        />
      </div>
      <div className={classes.borderBottom} />
      <WizardStepButtons
        {...props}
        focus
        showNext
        nextLabel={isSingleSuggest ? 'issueResolveLabel' : undefined}
        isFinal={!requiresAction(fullMoveStage)}
        showOtherNext={isSingleSuggest}
        showTerminate
        onNext={move}
        onOtherNext={convert}
        otherNextLabel='wizardAcceptLabel'
        onTerminate={() => finish(fullMoveStage, true)}
        terminateLabel={isMustResolve && _.isEmpty(isAssign) ? 'JobWizardBacktoJob' : 'JobWizardGotoJob'}
      />
    </WizardStepContainer>
  );
}

CloseCommentsStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

CloseCommentsStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default CloseCommentsStep;