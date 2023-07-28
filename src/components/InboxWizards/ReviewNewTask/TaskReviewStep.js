import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import JobDescription from '../JobDescription';
import {
  addCommentToMarket,
  getComment,
  getInvestibleComments
} from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { useHistory } from 'react-router';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { useIntl } from 'react-intl';
import { dismissWorkListItem, removeWorkListItem } from '../../../pages/Home/YourWork/WorkListItem';
import { getLabelForTerminate, getShowTerminate } from '../../../utils/messageUtils';
import { updateComment } from '../../../api/comments';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';

function TaskReviewStep(props) {
  const { marketId, commentId, message } = props;
  const classes = wizardStyles();
  const history = useHistory();
  const intl = useIntl();
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [, messagesDispatch] = useContext(NotificationsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const comment = getComment(commentsState, marketId, commentId);
  const investibleComments = getInvestibleComments(comment.investible_id, marketId, commentsState);
  const orderedTasks = investibleComments.filter((aComment) => {
    return aComment.id !== commentId && aComment.root_comment_id === commentId;
  }) || [];
  orderedTasks.unshift(comment);

  function markInProgress() {
    return updateComment({marketId, commentId, inProgress: true}).then((comment) => {
      setOperationRunning(false);
      addCommentToMarket(comment, commentsState, commentsDispatch);
      dismissWorkListItem(message, messagesDispatch, history);
    });
  }

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        {intl.formatMessage({id: 'NewTaskTitle'})}
      </Typography>
      <JobDescription marketId={marketId} investibleId={comment.investible_id} comments={orderedTasks}
                      removeActions preserveOrder />
      <WizardStepButtons
        {...props}
        nextLabel="issueReplyLabel"
        spinOnClick={false}
        showOtherNext
        onOtherNext={markInProgress}
        otherNextLabel="markInProgress"
        onOtherNextDoAdvance={false}
        terminateLabel={getLabelForTerminate(message)}
        showTerminate={getShowTerminate(message)}
        onFinish={() => removeWorkListItem(message, messagesDispatch, history)}
      />
    </WizardStepContainer>
  );
}

TaskReviewStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

TaskReviewStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default TaskReviewStep;