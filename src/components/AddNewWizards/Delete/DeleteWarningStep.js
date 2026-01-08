import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import WizardStepButtons from '../WizardStepButtons';
import {
  DISCUSSION_HASH,
  formatGroupLinkWithSuffix,
  formInvestibleLink,
  MARKET_TODOS_HASH,
  navigate
} from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { WizardStylesContext } from '../WizardStylesContext';
import { removeComment } from '../../../api/comments';
import { addMarketComments, getComment } from '../../../contexts/CommentsContext/commentsContextHelper';
import { removeMessagesForCommentId } from '../../../utils/messageUtils';
import { getInboxTarget } from '../../../contexts/NotificationsContext/notificationsContextHelper';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import { TODO_TYPE } from '../../../constants/comments';

function DeleteWarningStep(props) {
  const { marketId, commentId, isInbox, formData = {}, updateFormData = () => {} } = props;
  const history = useHistory();
  const classes = useContext(WizardStylesContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const commentToDelete = getComment(commentsState, marketId, commentId);
  const { useCompression } = formData;

  function remove() {
    return removeComment(marketId, commentId)
      .then((comment) => {
        addMarketComments(commentsDispatch, marketId, [comment]);
        removeMessagesForCommentId(comment.id, messagesState, messagesDispatch);
        setOperationRunning(false);
        if (isInbox) {
          navigate(history, getInboxTarget());
        } else {
          const { investible_id: investibleId, comment_type: commentType, group_id: groupId } = comment;
          if (investibleId) {
            navigate(history, formInvestibleLink(marketId, investibleId));
          } else {
            if (commentType === TODO_TYPE) {
              navigate(history, formatGroupLinkWithSuffix(MARKET_TODOS_HASH, marketId, groupId));
            } else {
              navigate(history, formatGroupLinkWithSuffix(DISCUSSION_HASH, marketId, groupId));
            }
          }
        }
      });
  }

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        Are you sure you want to delete?
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        This operation cannot be undone.
      </Typography>
      <CommentBox
        comments={[commentToDelete]}
        marketId={marketId}
        allowedTypes={[]}
        removeActions
        showVoting={false}
        isInbox
        compressAll
        inboxMessageId={commentId}
        toggleCompression={() => updateFormData({ useCompression: !useCompression })}
        useCompression={useCompression}
        displayRepliesAsTop
      />
      <div className={classes.borderBottom}/>
      <WizardStepButtons
        {...props}
        nextLabel="commentRemoveLabel"
        focus
        onNext={remove}
        showTerminate
        onTerminate={() => navigate(history)}
        terminateLabel="OnboardingWizardGoBack"
      />
    </WizardStepContainer>
  );
}

DeleteWarningStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

export default DeleteWarningStep;