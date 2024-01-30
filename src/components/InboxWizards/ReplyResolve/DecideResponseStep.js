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
import { resolveComment, updateComment } from '../../../api/comments';
import { getLabelForTerminate, getShowTerminate } from '../../../utils/messageUtils';
import { TODO_TYPE } from '../../../constants/comments';
import { formCommentLink, formWizardLink, navigate } from '../../../utils/marketIdPathFunctions';
import { REPLY_WIZARD_TYPE } from '../../../constants/markets';

function DecideResponseStep(props) {
  const { marketId, commentId, message, formData, updateFormData } = props;
  const [commentState, commentDispatch] = useContext(CommentsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [, messagesDispatch] = useContext(NotificationsContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const intl = useIntl();
  const history = useHistory();
  const commentRoot = getCommentRoot(commentState, marketId, commentId) || {id: 'fake'};
  const comments = (commentState[marketId] || []).filter((comment) =>
    comment.root_comment_id === commentRoot.id || comment.id === commentRoot.id);
  const classes = wizardStyles();
  const { useCompression } = formData;

  function myTerminate() {
    removeWorkListItem(message, messagesDispatch, history);
  }

  function moveToTask() {
    return updateComment({marketId, commentId, commentType: TODO_TYPE}).then((comment) => {
      addCommentToMarket(comment, commentState, commentDispatch);
      setOperationRunning(false);
      dismissWorkListItem(message, messagesDispatch);
      navigate(history, formCommentLink(marketId, comment.group_id, comment.investible_id, comment.id));
    })
  }

  function resolve() {
    return resolveComment(marketId, commentId)
      .then((comment) => {
        addCommentToMarket(comment, commentsState, commentsDispatch);
        setOperationRunning(false);
        dismissWorkListItem(message, messagesDispatch, history);
      });
  }

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        {intl.formatMessage({id: 'DecideIdeaTitle'})}
      </Typography>
      {commentRoot.investible_id && (
        <Typography className={classes.introSubText} variant="subtitle1">
          If you are very certain then move this suggestion to a task and otherwise reply. Click the suggestion to
          leave this wizard and add voting, resolve, or move.
        </Typography>
      )}
      {!commentRoot.investible_id && (
        <Typography className={classes.introSubText} variant="subtitle1">
          Click the suggestion to leave this wizard and add voting or move.
        </Typography>
      )}
      <JobDescription marketId={marketId} investibleId={commentRoot.investible_id}
                      useCompression={useCompression}
                      toggleCompression={() => updateFormData({useCompression: !useCompression})}
                      comments={comments} removeActions />
      <WizardStepButtons
        {...props}
        nextLabel='UnblockReplyLabel'
        onNext={() => navigate(history, formWizardLink(REPLY_WIZARD_TYPE, marketId,
          undefined, undefined, commentId, message.type_object_id))}
        spinOnClick={false}
        showOtherNext
        otherNextLabel={commentRoot.investible_id ? 'wizardAcceptLabel' : 'issueResolveLabel'}
        onOtherNext={commentRoot.investible_id ? moveToTask : resolve}
        onOtherNextDoAdvance={false}
        isOtherFinal
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