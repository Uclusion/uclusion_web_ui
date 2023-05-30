import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import { addCommentToMarket, getCommentRoot } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { removeWorkListItem } from '../../../pages/Home/YourWork/WorkListItem';
import { useIntl } from 'react-intl';
import JobDescription from '../JobDescription';
import { findMessageForCommentId } from '../../../utils/messageUtils';
import _ from 'lodash';
import { getMyUserForMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { resolveComment } from '../../../api/comments';
import { getFullStage, isRequiredInputStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { addInvestible, getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { getMarketInfo } from '../../../utils/userFunctions';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { REPORT_TYPE } from '../../../constants/comments';
import { useHistory } from 'react-router';

function DecideReplyStep(props) {
  const { marketId, commentId, message } = props;
  const [commentState, commentDispatch] = useContext(CommentsContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [marketsState] = useContext(MarketsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [investiblesState, investiblesDispatch] = useContext(InvestiblesContext);
  const commentRoot = getCommentRoot(commentState, marketId, commentId) || {id: 'fake'};
  const userId = getMyUserForMarket(marketsState, marketId) || {};
  const canResolve = commentRoot.created_by === userId && commentRoot.comment_type !== REPORT_TYPE;
  const comments = (commentState[marketId] || []).filter((comment) =>
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
  const { stage, former_stage_id: formerStageId } = marketInfo;
  const fullStage = getFullStage(marketStagesState, marketId, stage) || {};

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
        if (formerStageId && fullStage && isRequiredInputStage(fullStage)) {
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
        removeWorkListItem(message, messagesDispatch, history);
      });
  }

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText}>
        {intl.formatMessage({id: 'unreadReply'})}
      </Typography>
      {commentRoot.investible_id && (
        <JobDescription marketId={marketId} investibleId={commentRoot.investible_id} comments={comments}
                        showDescription={false}
                        showAssigned={false}
                        removeActions
                        inboxMessageId={commentId} />
      )}
      {!commentRoot.investible_id && (
        <div className={classes.wizardCommentBoxDiv}>
          <CommentBox
            comments={comments}
            marketId={marketId}
            allowedTypes={[]}
            isInbox
            inboxMessageId={commentId}
            removeActions
          />
        </div>
      )}
      <WizardStepButtons
        {...props}
        nextLabel="issueReplyLabel"
        spinOnClick={false}
        showOtherNext={canResolve || hasThreadMessages}
        otherNextLabel={canResolve ? 'issueResolveLabel' : 'notificationDelete'}
        onOtherNext={canResolve ? resolve : myOnFinish}
        otherSpinOnClick={canResolve}
        showTerminate
        terminateLabel={hasThreadMessages ? 'notificationDismissThread' : 'notificationDelete'}
        onFinish={hasThreadMessages ? dismissAll : myOnFinish}
      />
    </div>
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