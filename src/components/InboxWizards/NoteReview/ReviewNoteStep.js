import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import { useIntl } from 'react-intl';
import { useHistory } from 'react-router';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import JobDescription from '../JobDescription';
import {
  getCommentRoot,
  getMarketComments
} from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { EditCommentContext } from '../../../contexts/EditCommentContext/EditCommentContext';
import { removeWorkListItem } from '../../../pages/Home/YourWork/WorkListItem';

function ReviewNoteStep(props) {
  const { marketId, commentId, message, formData = {}, updateFormData = () => {} } = props;
  const [commentsState] = useContext(CommentsContext);
  const [, messagesDispatch] = useContext(NotificationsContext);
  const { openEditComment } = useContext(EditCommentContext);
  const history = useHistory();
  const intl = useIntl();
  const classes = wizardStyles();
  const commentRoot = getCommentRoot(commentsState, marketId, commentId) || {id: commentId};
  const comments = getMarketComments(commentsState, marketId).filter((comment) =>
    comment.root_comment_id === commentRoot.id || comment.id === commentRoot.id);
  const { useCompression } = formData;

  function dismiss() {
    removeWorkListItem(message, messagesDispatch, history);
  }

  function editNote() {
    openEditComment(marketId, commentRoot.id);
    dismiss();
  }

  return (
    <WizardStepContainer {...props}>
      <Typography className={classes.introText}>
        {intl.formatMessage({ id: 'ReviewAINoteTitle' })}
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        {intl.formatMessage({ id: 'ReviewAINoteExplanation' })}
      </Typography>
      <JobDescription marketId={marketId} comments={comments} removeActions
                      useCompression={useCompression} inboxMessageId={commentRoot.id}
                      toggleCompression={() => updateFormData({ useCompression: !useCompression })}/>
      <div className={classes.borderBottom}/>
      <WizardStepButtons
        {...props}
        focus
        nextLabel="editNote"
        nextShowEdit
        spinOnClick={false}
        onNextDoAdvance={false}
        onNext={editNote}
        showTerminate
        terminateLabel="notificationDismiss"
        onFinish={dismiss}
      />
    </WizardStepContainer>
  );
}

ReviewNoteStep.propTypes = {
  marketId: PropTypes.string.isRequired,
  commentId: PropTypes.string.isRequired,
  message: PropTypes.object.isRequired,
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

export default ReviewNoteStep;
