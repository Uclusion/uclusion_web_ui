import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import { useIntl } from 'react-intl';
import { formCommentLink, navigate } from '../../../utils/marketIdPathFunctions';
import CommentAdd from '../../Comments/CommentAdd';
import { useHistory } from 'react-router';
import { getPageReducerPage, usePageStateReducer } from '../../PageState/pageStateHooks';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { addInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import {
  ISSUE_TYPE,
  QUESTION_TYPE,
  REPLY_TYPE,
  REPORT_TYPE,
  SUGGEST_CHANGE_TYPE,
  TODO_TYPE
} from '../../../constants/comments';
import {
  getBlockedStage,
  getRequiredInputStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import JobDescription from '../../InboxWizards/JobDescription';
import { addCommentToMarket, getInvestibleComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import _ from 'lodash';
import { resolveComment } from '../../../api/comments';
import { removeMessagesForCommentId } from '../../../utils/messageUtils';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { usePresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';

function AddCommentStep (props) {
  const { investibleId, marketId, useType, updateFormData, formData, resolveId, groupId, currentStageId,
    assigned } = props;
  const intl = useIntl();
  const classes = useContext(WizardStylesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentState, commentDispatch] = useContext(CommentsContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const presences = usePresences(marketId);
  const requiresInputStage = getRequiredInputStage(marketStagesState, marketId) || {};
  const blockingStage = getBlockedStage(marketStagesState, marketId) || {};
  const history = useHistory();
  const [commentAddStateFull, commentAddDispatch] = usePageStateReducer('addDecisionCommentWizard');
  const [commentAddState, updateCommentAddState, commentAddStateReset] =
    getPageReducerPage(commentAddStateFull, commentAddDispatch, investibleId);
  const isAssistance = [ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE].includes(useType);
  const inAssistanceStage = [requiresInputStage.id, blockingStage.id].includes(currentStageId);
  const investibleComments = getInvestibleComments(investibleId, marketId, commentState);
  const comments = useType === TODO_TYPE ? investibleComments?.filter((comment) =>
    [TODO_TYPE, REPLY_TYPE].includes(comment.comment_type)) : undefined;
  const { useCompression } = formData;
  const isResolve = !_.isEmpty(resolveId);
  const myPresence = presences?.find((presence) => presence.current_user);
  const userId = myPresence?.id;
  const userIsAssigned = assigned?.includes(userId);

  function onSave(comment) {
    if (comment.is_sent) {
      navigate(history, formCommentLink(marketId, groupId, investibleId, comment.id));
    } else {
      updateFormData({inlineMarketId: comment.inline_market_id, commentId: comment.id, marketId, investibleId,
        groupId});
    }
  }

  function onReportResolveOnly() {
    return resolveComment(marketId, resolveId)
      .then((response) => {
        const comment = response['comment'];
        addCommentToMarket(comment, commentState, commentDispatch);
        removeMessagesForCommentId(resolveId, messagesState, messagesDispatch);
        addInvestible(investiblesDispatch, () => {}, response['investible']);
        setOperationRunning(false);
        navigate(history, formCommentLink(marketId, groupId, investibleId, resolveId));
      });
  }

  const movingJob = isAssistance && !inAssistanceStage && userIsAssigned;
  return (
    <WizardStepContainer
      {...props}
      isXLarge
    >
      <Typography className={classes.introText}>
        What is your {intl.formatMessage({ id: `${useType.toLowerCase()}Simple` })}?
      </Typography>
      {movingJob && (
        <Typography className={classes.introSubText} variant="subtitle1">
          Opening this {intl.formatMessage({ id: `${useType.toLowerCase()}Simple` })} moves the job to
          Assistance Needed. Whole group notified unless use @ mentions.
        </Typography>
      )}
      {!movingJob && (
        <Typography className={classes.introSubText} variant="subtitle1">
          Add options to start voting on possible answers to this question. Whole group notified unless use @ mentions.
        </Typography>
      )}
      {useType === TODO_TYPE && (
        <Typography className={classes.introSubText} variant="subtitle1">
          Opening a task prevents moving this job to Tasks Complete stage until resolved.
        </Typography>
      )}
      {useType === REPORT_TYPE && !isResolve && (
        <Typography className={classes.introSubText} variant="subtitle1">
          For feedback from whole group explain what needs reviewing. Use @ mentions to require and only notify
          specific reviewers.
        </Typography>
      )}
      {useType === REPORT_TYPE && isResolve && (
        <Typography className={classes.introSubText} variant="subtitle1">
          Opening a new progress report automatically resolves older reports. If you don't have a new report choose
          'Resolve only' below.
        </Typography>
      )}
      {![REPORT_TYPE, TODO_TYPE].includes(useType) && !movingJob && (
        <Typography className={classes.introSubText} variant="subtitle1">
          This {intl.formatMessage({ id: `${useType.toLowerCase()}Simple` })} notifies whole group unless use
          @ mentions.
        </Typography>
      )}
      <JobDescription marketId={marketId} investibleId={investibleId} comments={comments}
                      useCompression={useCompression}
                      toggleCompression={() => updateFormData({ useCompression: !useCompression })}/>
      <div className={classes.borderBottom}/>
      <CommentAdd
        nameKey="JobCommentAdd"
        type={useType}
        wizardProps={{ ...props, isAddWizard: true, isResolve, onResolve: onReportResolveOnly }}
        commentAddState={commentAddState}
        updateCommentAddState={updateCommentAddState}
        commentAddStateReset={commentAddStateReset}
        marketId={marketId}
        groupId={groupId}
        fromInvestibleId={investibleId}
        onSave={onSave}
        nameDifferentiator="jobComment"
      />
    </WizardStepContainer>
  );
}

AddCommentStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

AddCommentStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default AddCommentStep;