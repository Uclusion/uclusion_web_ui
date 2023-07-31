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
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { useIntl } from 'react-intl';
import JobDescription from '../JobDescription';
import { useHistory } from 'react-router';
import { updateComment } from '../../../api/comments';
import { getLabelForTerminate, getShowTerminate } from '../../../utils/messageUtils';
import { TODO_TYPE } from '../../../constants/comments';

function DecideResponseStep(props) {
  const { marketId, commentId, message } = props;
  const [commentState, commentDispatch] = useContext(CommentsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [, messagesDispatch] = useContext(NotificationsContext);
  const intl = useIntl();
  const history = useHistory();
  const commentRoot = getCommentRoot(commentState, marketId, commentId) || {id: 'fake'};
  const comments = (commentState[marketId] || []).filter((comment) =>
    comment.root_comment_id === commentRoot.id || comment.id === commentRoot.id);
  const classes = wizardStyles();

  function myTerminate() {
    removeWorkListItem(message, messagesDispatch, history);
  }

  function moveToTask() {
    return updateComment({marketId, commentId, commentType: TODO_TYPE}).then((comment) => {
      addCommentToMarket(comment, commentState, commentDispatch);
      setOperationRunning(false);
      dismissWorkListItem(message, messagesDispatch, history);
    })
  }

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        {intl.formatMessage({id: 'DecideResponseTitle'})}
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        The creator of this suggestion wants feedback on this idea for this job.
      </Typography>
      <JobDescription marketId={marketId} investibleId={commentRoot.investible_id} comments={comments} removeActions />
      <WizardStepButtons
        {...props}
        nextLabel='UnblockReplyLabel'
        spinOnClick={false}
        showOtherNext
        otherNextLabel='wizardAcceptLabel'
        onOtherNext={moveToTask}
        onFinish={myTerminate}
        showTerminate={getShowTerminate(message)}
        terminateLabel={getLabelForTerminate(message)}
      />
    </WizardStepContainer>
  );
}

DecideResponseStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

DecideResponseStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default DecideResponseStep;