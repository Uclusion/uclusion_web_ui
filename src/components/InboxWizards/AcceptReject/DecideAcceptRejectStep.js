import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { addCommentToMarket, getCommentRoot } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { useHistory } from 'react-router';
import { wizardFinish } from '../InboxWizardUtils';
import { formCommentLink } from '../../../utils/marketIdPathFunctions';
import { removeWorkListItem, workListStyles } from '../../../pages/Home/YourWork/WorkListItem';
import { resolveComment, updateComment } from '../../../api/comments';
import { TODO_TYPE } from '../../../constants/comments';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import JobDescription from '../JobDescription';

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
  const workItemClasses = workListStyles();

  function myOnFinish() {
    wizardFinish({link: formCommentLink(marketId, commentRoot.group_id, commentRoot.investible_id,
          commentRoot.id)},
      setOperationRunning, message, history, marketId, commentRoot.investible_id, messagesDispatch);
  }

  function accept() {
    return updateComment(marketId, commentId, undefined, TODO_TYPE).then((comment) => {
      addCommentToMarket(comment, commentsState, commentsDispatch);
      removeWorkListItem(message, workItemClasses.removed, messagesDispatch);
      setOperationRunning(false);
    })
  }

  function resolve() {
    return resolveComment(marketId, commentId)
      .then((comment) => {
        addCommentToMarket(comment, commentsState, commentsDispatch);
        removeWorkListItem(message, workItemClasses.removed, messagesDispatch);
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
      <JobDescription marketId={marketId} investibleId={commentRoot.investible_id} comments={comments} />
      <WizardStepButtons
        {...props}
        onFinish={myOnFinish}
        nextLabel="wizardAcceptLabel"
        onNext={accept}
        showOtherNext
        otherNextLabel="issueResolveLabel"
        onOtherNext={resolve}
        showTerminate={true}
        terminateLabel="JobWizardGotoJob"
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