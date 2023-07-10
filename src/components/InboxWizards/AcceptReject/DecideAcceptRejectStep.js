import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { addCommentToMarket, getCommentRoot } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { dismissWorkListItem, removeWorkListItem } from '../../../pages/Home/YourWork/WorkListItem';
import { resolveComment, updateComment } from '../../../api/comments';
import { TODO_TYPE } from '../../../constants/comments';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import JobDescription from '../JobDescription';
import { useHistory } from 'react-router';

function DecideAcceptRejectStep(props) {
  const { marketId, commentId, message } = props;
  const [commentState] = useContext(CommentsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [, messagesDispatch] = useContext(NotificationsContext);
  const history = useHistory();
  const commentRoot = getCommentRoot(commentState, marketId, commentId) || {id: 'fake'};
  const comments = (commentState[marketId] || []).filter((comment) =>
    comment.root_comment_id === commentRoot.id || comment.id === commentRoot.id);
  const classes = wizardStyles();

  function myOnFinish() {
    removeWorkListItem(message, messagesDispatch, history);
  }

  function accept() {
    return updateComment({marketId, commentId, commentType: TODO_TYPE}).then((comment) => {
      addCommentToMarket(comment, commentsState, commentsDispatch);
      dismissWorkListItem(message, messagesDispatch, history);
      setOperationRunning(false);
    })
  }

  function resolve() {
    return resolveComment(marketId, commentId)
      .then((comment) => {
        addCommentToMarket(comment, commentsState, commentsDispatch);
        dismissWorkListItem(message, messagesDispatch, history);
        setOperationRunning(false);
      });
  }

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText}>
        Do you accept this suggestion?
      </Typography>
      <JobDescription marketId={marketId} investibleId={commentRoot.investible_id} comments={comments} removeActions />
      <WizardStepButtons
        {...props}
        onFinish={myOnFinish}
        nextLabel="wizardAcceptLabel"
        onNext={accept}
        showOtherNext
        otherNextLabel="issueResolveLabel"
        onOtherNext={resolve}
        showTerminate={message.type_object_id.startsWith('UNREAD') || message.is_highlighted}
        terminateLabel={message.type_object_id.startsWith('UNREAD') ? 'notificationDelete' : 'defer'}
      />
    </div>
    </WizardStepContainer>
  );
}

DecideAcceptRejectStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

DecideAcceptRejectStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default DecideAcceptRejectStep;