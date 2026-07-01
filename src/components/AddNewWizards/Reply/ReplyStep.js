import React, { useContext, useState } from 'react';
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
import ChoicePills from '../../Buttons/ChoicePills';
import { WizardStylesContext } from '../WizardStylesContext';
import { REPLY_TYPE, REPORT_TYPE, TODO_TYPE } from '../../../constants/comments';
import CommentAdd, { hasCommentValue } from '../../Comments/CommentAdd';
import { getPageReducerPage, usePageStateReducer } from '../../PageState/pageStateHooks';
import { usePresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { PLANNING_TYPE } from '../../../constants/markets';
import { FormattedMessage } from 'react-intl';

export function hasReply(comment) {
  return hasCommentValue(comment.group_id, comment, 'CommentAddReply', undefined,
    'reply');
}

function ReplyStep(props) {
  const { marketId, commentId, isSubtask, isNote: addingNote, updateFormData = () => {}, formData = {} } = props;
  const history = useHistory();
  const [commentState, commentDispatch] = useContext(CommentsContext);
  const [investibleState, investiblesDispatch] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [marketsState] = useContext(MarketsContext);
  const classes = useContext(WizardStylesContext);
  const presences = usePresences(marketId);
  const [commentType, setCommentType] = useState(REPLY_TYPE);
  const comment = getComment(commentState, marketId, commentId) || {};
  const { comment_type: parentCommentType, created_by: createdById, investible_id: investibleId } = comment;
  const myPresence = presences.find((presence) => presence.current_user) || {};
  const market = getMarket(marketsState, marketId)
  // A resolved task cannot take replies or grouped subtasks but a note is still allowed since it
  // does not reopen the task - see T-all-2142
  const noteOnly = market?.market_type === PLANNING_TYPE && parentCommentType === TODO_TYPE && investibleId
    && comment.resolved;
  // isSubtask is set when the non-author "Grouped" button launches this wizard, so they can open a
  // grouped subtask or note on someone else's task even though they are not the task author.
  const showSubTask = market?.market_type === PLANNING_TYPE && parentCommentType === TODO_TYPE && investibleId
    && (myPresence.id === createdById || isSubtask) && !noteOnly;
  // addingNote is set when the non-author "Note" button launches this wizard on someone else's note, so
  // they can create a sub note the way AI does - a REPLY with BLUE notification, the same shape the
  // grouped-subtask reply uses, NOT a top level report - see T-all-2157 / T-all-2245.
  const noteReply = !!addingNote;
  const useCommentType = noteOnly ? REPORT_TYPE : commentType;
  const inv = comment.investible_id ? getInvestible(investibleState, investibleId) : undefined;
  const investibleComments = getInvestibleComments(inv?.investible?.id, marketId, commentState);
  const marketComments = getMarketComments(commentState, marketId, comment?.group_id);
  const [commentAddReplyStateFull, commentAddReplyDispatch] = usePageStateReducer('addReplyWizard');
  const [commentAddReplyState, updateCommentAddReplyState, commentAddStateReplyReset] =
    getPageReducerPage(commentAddReplyStateFull, commentAddReplyDispatch, commentId);
  const threadAboveIds = getThreadAboveIds(commentId, marketComments);
  const comments = showSubTask || noteOnly ? investibleComments.filter((aComment) => aComment.id === commentId ||
    (aComment.reply_id === commentId && myPresence.id === aComment.created_by)) :
    marketComments.filter((aComment) => threadAboveIds.includes(aComment.id));
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
      {!showSubTask && !noteOnly && !noteReply && (
        <Typography className={classes.introText}>
          What is your reply?
        </Typography>
      )}
      {showSubTask && (
        <Typography className={classes.introText}>
          What is your grouped task or note?
        </Typography>
      )}
      {(noteOnly || noteReply) && (
        <Typography className={classes.introText}>
          What is your note?
        </Typography>
      )}
      {!showSubTask && !noteOnly && !noteReply && (
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
      {showSubTask && (
        <ChoicePills
          ariaLabel="add-reply-type"
          value={commentType}
          onChange={(value) => setCommentType(value)}
          options={[REPLY_TYPE, REPORT_TYPE].map((aType) => ({
            value: aType,
            id: `${aType}`,
            label: <FormattedMessage id={`commentTypeLabel${showSubTask && aType === REPLY_TYPE ? 'SubTask' : ''}${aType}`} />,
          }))}
        />
      )}
      {!showSubTask && !noteOnly && !noteReply && (
        <div className={classes.borderBottom}/>
      )}
      <CommentAdd
        nameKey="CommentAddReply"
        type={useCommentType}
        parent={comment}
        wizardProps={{...props, isReply: useCommentType === REPLY_TYPE, isNote: useCommentType === REPORT_TYPE,
          isNoteReply: noteReply,
          onResolve: showSubTask || noteOnly || noteReply ? () => {} : resolve, showSubTask, parentIsTopLevel}}
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

export default ReplyStep;