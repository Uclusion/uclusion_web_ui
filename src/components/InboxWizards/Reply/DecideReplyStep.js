import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import {
  addCommentToMarket, getComment,
  getCommentRoot,
  getInvestibleComments,
  getMarketComments,
} from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { dismissWorkListItem, removeWorkListItem } from '../../../pages/Home/YourWork/WorkListItem';
import { useIntl } from 'react-intl';
import JobDescription from '../JobDescription';
import {
  findMessageForCommentId,
  getLabelForTerminate,
  getShowTerminate,
  removeInlineMarketMessages
} from '../../../utils/messageUtils';
import _ from 'lodash';
import { resolveComment } from '../../../api/comments';
import { getFullStage, isRequiredInputStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { addInvestible, getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { getMarketInfo } from '../../../utils/userFunctions';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { REPORT_TYPE, SUGGEST_CHANGE_TYPE } from '../../../constants/comments';
import { useHistory } from 'react-router';
import { isSingleAssisted } from '../../../utils/commentFunctions';
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { formMarketAddInvestibleLink, formWizardLink, navigate } from '../../../utils/marketIdPathFunctions';
import { BUG_WIZARD_TYPE, REPLY_WIZARD_TYPE } from '../../../constants/markets';
import { hasReply } from '../../AddNewWizards/Reply/ReplyStep';

function DecideReplyStep(props) {
  const { marketId, commentId, message, formData, updateFormData } = props;
  const [commentState, commentDispatch] = useContext(CommentsContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [investiblesState, investiblesDispatch] = useContext(InvestiblesContext);
  const commentRoot = getCommentRoot(commentState, marketId, commentId) || {id: 'fake'};
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const myPresence = marketPresences.find((presence) => presence.current_user);
  const userId = myPresence?.id;
  const { comment_type: commentType, group_id: groupId } = commentRoot;
  const { type: messageType } = message;
  const isReplyToReply = commentRoot.id !== commentId;
  const canResolve = commentType !== REPORT_TYPE || isReplyToReply;
  const investibleComments = getInvestibleComments(commentRoot.investible_id, marketId, commentState);
  const marketComments = getMarketComments(commentState, marketId, commentRoot.group_id);
  const comments = marketComments.filter((comment) =>
    comment.root_comment_id === commentRoot.id || comment.id === commentRoot.id);
  const threadMessages = [];
  comments.forEach((comment) => {
    const myMessage = findMessageForCommentId(comment.id, messagesState);
    if (myMessage && ['UNREAD_COMMENT', 'UNREAD_REPLY'].includes(myMessage.type)) {
      threadMessages.push(myMessage);
    }
  });
  const hasThreadMessages = _.size(threadMessages) > 1;
  const classes = wizardStyles();
  const intl = useIntl();
  const history = useHistory();
  const inv = commentRoot.investible_id ? getInvestible(investiblesState, commentRoot.investible_id)
    : undefined;
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { stage, former_stage_id: formerStageId, assigned } = marketInfo;
  const fullStage = getFullStage(marketStagesState, marketId, stage) || {};
  let isAssigned = false;
  if (inv) {
    const marketInfo = getMarketInfo(inv, marketId) || {};
    const { assigned } = marketInfo;
    isAssigned = (assigned || []).includes(userId);
  }
  const isMySuggestion = commentType === SUGGEST_CHANGE_TYPE && isAssigned;
  const { useCompression } = formData;

  function myOnFinish() {
    removeWorkListItem(message, messagesDispatch, history);
  }

  function dismissAll() {
    threadMessages.forEach((aMessage) => removeWorkListItem(aMessage, messagesDispatch, history))
  }

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
  const showOtherNext = isMySuggestion || canResolve;
  const moveToTask = () => navigate(history,
    `${formMarketAddInvestibleLink(marketId, groupId, undefined, message.type_object_id, 
      BUG_WIZARD_TYPE)}&fromCommentId=${commentId}`);

  const showTerminate = getShowTerminate(message);
  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        {intl.formatMessage({ id: messageType === 'REPLY_MENTION' ? 'unreadMention' : 'unreadReply' })}
      </Typography>
      {showOtherNext && isMySuggestion && (
        <Typography className={classes.introSubText} variant="subtitle1">
          Choose other options to move to task, add voting, or resolve.
        </Typography>
      )}
      {showOtherNext && !isMySuggestion && (
        <Typography className={classes.introSubText} variant="subtitle1">
          Choose move to create a task, bug, or suggestion instead of replying.
        </Typography>
      )}
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
        nextLabel="issueReplyLabel"
        onNext={() => navigate(history, formWizardLink(REPLY_WIZARD_TYPE, marketId,
          undefined, undefined, commentId, message.type_object_id))}
        nextShowEdit={hasReply(getComment(commentState, marketId, commentId))}
        spinOnClick={false}
        onNextDoAdvance={false}
        showOtherNext={showOtherNext}
        otherNextLabel={isMySuggestion ? 'otherOptionsLabel' : ((showTerminate && !isReplyToReply) ?
          'issueResolveLabel' : 'move')}
        onOtherNext={isMySuggestion ? undefined : ((showTerminate && !isReplyToReply) ? resolve : moveToTask)}
        otherSpinOnClick={!isMySuggestion && !isReplyToReply && showTerminate}
        isOtherFinal={!isMySuggestion}
        onOtherNextDoAdvance={isMySuggestion}
        showTerminate={showTerminate || (!isMySuggestion && canResolve)}
        terminateLabel={showTerminate ?
          (hasThreadMessages ? 'notificationDismissThread' : getLabelForTerminate(message)) : 'issueResolveLabel'}
        onFinish={showTerminate ? (hasThreadMessages ? dismissAll : myOnFinish) : resolve}
      />
    </WizardStepContainer>
  );
}

DecideReplyStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

DecideReplyStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default DecideReplyStep;