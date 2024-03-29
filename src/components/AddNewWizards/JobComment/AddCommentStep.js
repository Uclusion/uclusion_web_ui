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
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { getMarketInfo } from '../../../utils/userFunctions';
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
import { getInvestibleComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';

function AddCommentStep (props) {
  const { investibleId, marketId, useType, updateFormData, formData } = props;
  const intl = useIntl();
  const classes = useContext(WizardStylesContext);
  const [investibleState] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentState] = useContext(CommentsContext);
  const inv = getInvestible(investibleState, investibleId) || {};
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { group_id: groupId, stage: currentStageId } = marketInfo;
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

  function onSave(comment) {
    if (comment.is_sent) {
      navigate(history, formCommentLink(marketId, groupId, investibleId, comment.id));
    } else {
      updateFormData({inlineMarketId: comment.inline_market_id, commentId: comment.id, marketId, investibleId,
        groupId});
    }
  }
  const movingJob = isAssistance && !inAssistanceStage;
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
          Assistance Needed. Use @ mentions to specify who is notified.
        </Typography>
      )}
      {useType === TODO_TYPE && (
        <Typography className={classes.introSubText} variant="subtitle1">
          Opening a task prevents moving this job to Tasks Complete stage until resolved.
        </Typography>
      )}
      {useType === REPORT_TYPE && (
        <Typography className={classes.introSubText} variant="subtitle1">
          For feedback explain what needs reviewing. Use @ mentions to require and only notify specific reviewers.
        </Typography>
      )}
      {![REPORT_TYPE, TODO_TYPE].includes(useType) && !movingJob && (
        <Typography className={classes.introSubText} variant="subtitle1">
          Use @ mentions to limit who this {intl.formatMessage({ id: `${useType.toLowerCase()}Simple` })} notifies.
        </Typography>
        )}
      <JobDescription marketId={marketId} investibleId={investibleId} comments={comments}
                      useCompression={useCompression}
                      toggleCompression={() => updateFormData({useCompression: !useCompression})} />
      <CommentAdd
        nameKey="JobCommentAdd"
        type={useType}
        wizardProps={{...props, isAddWizard: true}}
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