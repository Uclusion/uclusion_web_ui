import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import {
  addCommentToMarket, getComment,
  getCommentRoot,
  getInvestibleComments, getMarketComments, getThreadAboveIds
} from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { addInvestible, getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { getMarketInfo } from '../../../utils/userFunctions';
import { getFullStage, isRequiredInputStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { dismissWorkListItem } from '../../../pages/Home/YourWork/WorkListItem';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import { useHistory } from 'react-router';
import { resolveComment } from '../../../api/comments';
import { findMessageForCommentId, removeInlineMarketMessages } from '../../../utils/messageUtils';
import { isSingleAssisted } from '../../../utils/commentFunctions';
import _ from 'lodash';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { formCommentLink, formInvestibleLink, formMarketLink, navigate } from '../../../utils/marketIdPathFunctions';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import { REPLY_TYPE, TODO_TYPE } from '../../../constants/comments';
import CommentAdd, { hasCommentValue } from '../../Comments/CommentAdd';
import { getPageReducerPage, usePageStateReducer } from '../../PageState/pageStateHooks';
import { usePresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';

export function hasReply(comment) {
  return hasCommentValue(comment.group_id, comment, 'CommentAddReply', undefined,
    'reply');
}

function ReplyStep(props) {
  const { marketId, commentId, updateFormData, formData } = props;
  const history = useHistory();
  const [commentState, commentDispatch] = useContext(CommentsContext);
  const [investibleState, investiblesDispatch] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const classes = useContext(WizardStylesContext);
  const presences = usePresences(marketId);
  const comment = getComment(commentState, marketId, commentId) || {};
  const { comment_type: commentType, created_by: createdById, investible_id: investibleId } = comment;
  const myPresence = presences.find((presence) => presence.current_user) || {};
  const showSubTask = commentType === TODO_TYPE && myPresence.id === createdById && investibleId;
  const inv = comment.investible_id ? getInvestible(investibleState, investibleId) : undefined;
  const investibleComments = getInvestibleComments(inv?.investible?.id, marketId, commentState);
  const marketComments = getMarketComments(commentState, marketId, comment?.group_id);
  const [commentAddReplyStateFull, commentAddReplyDispatch] = usePageStateReducer('addReplyWizard');
  const [commentAddReplyState, updateCommentAddReplyState, commentAddStateReplyReset] =
    getPageReducerPage(commentAddReplyStateFull, commentAddReplyDispatch, commentId);
  const threadAboveIds = getThreadAboveIds(commentId, marketComments);
  const comments = marketComments.filter((aComment) => threadAboveIds.includes(aComment.id));
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { stage, former_stage_id: formerStageId, assigned } = marketInfo;
  const fullStage = getFullStage(marketStagesState, marketId, stage) || {};
  const message = findMessageForCommentId(commentId, messagesState);
  const { useCompression } = formData;
  const parentIsTopLevel = _.isEmpty(comment.reply_id);

  function onSave(createdComment) {
    if (message) {
      dismissWorkListItem(message, messagesDispatch);
    }
    navigate(history, formCommentLink(createdComment.market_id, createdComment.group_id, createdComment.investible_id,
      createdComment.id));
  }

  function resolve() {
    setOperationRunning(true);
    const commentRoot = getCommentRoot(commentState, marketId, commentId);
    return resolveComment(marketId, commentRoot.id)
      .then((comment) => {
        addCommentToMarket(comment, commentState, commentDispatch);
        const inlineMarketId = comment.inline_market_id;
        if (inlineMarketId) {
          removeInlineMarketMessages(inlineMarketId, investibleState, commentState, messagesState, messagesDispatch);
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
        if (message) {
          dismissWorkListItem(message, messagesDispatch);
        }
        const navigateTo = comment.investible_id ? formInvestibleLink(marketId, comment.investible_id) :
          formMarketLink(marketId, comment.group_id);
        navigate(history, navigateTo);
      });
  }

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
      {!showSubTask && (
        <Typography className={classes.introText}>
          What is your reply?
        </Typography>
      )}
      {showSubTask && (
        <Typography className={classes.introText}>
          What is your subtask?
        </Typography>
      )}
      {!showSubTask && (
        <Typography className={classes.introSubText} variant="subtitle1">
          For response from more than the author of this comment use @ mentions.
        </Typography>
      )}
      <CommentBox
        comments={comments}
        marketId={marketId}
        allowedTypes={[]}
        fullStage={fullStage}
        investible={inv}
        marketInfo={marketInfo}
        isInbox
        removeActions
        replyEditId={commentId}
        inboxMessageId={commentId}
        compressAll
        toggleCompression={() => updateFormData({useCompression: !useCompression})}
        isReply
        useCompression={useCompression}
      />
      <div className={classes.borderBottom}/>
      <CommentAdd
        nameKey="CommentAddReply"
        type={REPLY_TYPE}
        parent={comment}
        wizardProps={{...props, isReply: true, onResolve: showSubTask ? () => {} : resolve, showSubTask,
          parentIsTopLevel}}
        commentAddState={commentAddReplyState}
        updateCommentAddState={updateCommentAddReplyState}
        commentAddStateReset={commentAddStateReplyReset}
        marketId={marketId}
        groupId={comment?.group_id}
        onSave={onSave}
        nameDifferentiator="reply"
      />
    </WizardStepContainer>
  );
}

ReplyStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

ReplyStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default ReplyStep;