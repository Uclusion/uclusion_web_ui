import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import {
  addCommentToMarket,
  getCommentRoot,
  getInvestibleComments,
  getMarketComments,
} from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { dismissWorkListItem } from '../../../pages/Home/YourWork/WorkListItem';
import { useIntl } from 'react-intl';
import JobDescription from '../JobDescription';
import { removeInlineMarketMessages } from '../../../utils/messageUtils';
import _ from 'lodash';
import { resolveComment, updateComment } from '../../../api/comments';
import { getFullStage, isRequiredInputStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { addInvestible, getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { getMarketInfo } from '../../../utils/userFunctions';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { useHistory } from 'react-router';
import { isSingleAssisted } from '../../../utils/commentFunctions';
import { TODO_TYPE } from '../../../constants/comments';
import {
  formCommentLink,
  formMarketAddInvestibleLink,
  formWizardLink,
  navigate
} from '../../../utils/marketIdPathFunctions';
import { BUG_WIZARD_TYPE, JOB_COMMENT_CONFIGURE_WIZARD_TYPE } from '../../../constants/markets';

function OtherOptionsStep(props) {
  const { marketId, commentId, message, formData = {}, updateFormData = () => {} } = props;
  const [commentState, commentDispatch] = useContext(CommentsContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [investiblesState, investiblesDispatch] = useContext(InvestiblesContext);
  const commentRoot = getCommentRoot(commentState, marketId, commentId) || {id: 'fake'};
  const { type: messageType, type_object_id: typeObjectId, inline_market_id: inlineMarketId } = message;
  const investibleComments = getInvestibleComments(commentRoot.investible_id, marketId, commentState);
  const marketComments = getMarketComments(commentState, marketId, commentRoot.group_id);
  const comments = marketComments.filter((comment) =>
    comment.root_comment_id === commentRoot.id || comment.id === commentRoot.id);
  const classes = wizardStyles();
  const intl = useIntl();
  const history = useHistory();
  const inv = commentRoot.investible_id ? getInvestible(investiblesState, commentRoot.investible_id)
    : undefined;
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { stage, former_stage_id: formerStageId, assigned } = marketInfo;
  const fullStage = getFullStage(marketStagesState, marketId, stage) || {};
  const { useCompression } = formData;

  function resolve() {
    return resolveComment(marketId, commentRoot.id)
      .then((comment) => {
        addCommentToMarket(comment, commentState, commentDispatch);
        const inlineMarketId = comment.inline_market_id;
        if (inlineMarketId) {
          removeInlineMarketMessages(inlineMarketId, investiblesState, commentState, messagesState, messagesDispatch);
        }
        if (formerStageId && fullStage && isRequiredInputStage(fullStage) &&
          isSingleAssisted(investibleComments, assigned)) {
          const newInfo = {
            ...marketInfo,
            stage: formerStageId,
            last_stage_change_date: comment.updated_at,
          };
          const newInfos = _.unionBy([newInfo], inv.market_infos, 'id');
          const newInvestible = {
            investible: inv.investible,
            market_infos: newInfos
          };
          addInvestible(investiblesDispatch, () => {}, newInvestible);
        }
        setOperationRunning(false);
        dismissWorkListItem(message, messagesDispatch, history);
      });
  }

  function moveToTask() {
    return updateComment({marketId, commentId, commentType: TODO_TYPE}).then((comment) => {
      addCommentToMarket(comment, commentState, commentDispatch);
      setOperationRunning(false);
      dismissWorkListItem(message, messagesDispatch);
      navigate(history, formCommentLink(marketId, comment.group_id, comment.investible_id, comment.id));
    })
  }

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        {intl.formatMessage({ id: messageType === 'REPLY_MENTION' ? 'unreadMention' : 'unreadReply' })}
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        Move reply to task if you want a new task from this reply.
      </Typography>
      <JobDescription marketId={marketId} investibleId={commentRoot.investible_id} comments={comments}
                      removeActions
                      isSingleTaskDisplay
                      useCompression={useCompression}
                      toggleCompression={() => updateFormData({ useCompression: !useCompression })}
                      inboxMessageId={commentId}/>
      <div className={classes.borderBottom}/>
      <WizardStepButtons
        {...props}
        focus
        nextLabel="moveReplyToTaskLabel"
        onNext={moveToTask}
        showOtherNext
        otherNextLabel={inlineMarketId ? 'moveSuggestionLabel' : 'addVoting'}
        otherSpinOnClick={false}
        onOtherNextDoAdvance={false}
        onOtherNext={() => inlineMarketId ? navigate(history,
            `${formMarketAddInvestibleLink(marketId, commentRoot.group_id, undefined, typeObjectId, 
              BUG_WIZARD_TYPE)}&fromCommentId=${commentRoot.id}`) :
          navigate(history, formWizardLink(JOB_COMMENT_CONFIGURE_WIZARD_TYPE, marketId,
          undefined, undefined, commentRoot.id, typeObjectId))}
        showTerminate
        terminateLabel="issueResolveLabel"
        onFinish={resolve}
      />
    </WizardStepContainer>
  );
}

OtherOptionsStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

export default OtherOptionsStep;