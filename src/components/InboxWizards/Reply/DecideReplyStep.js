import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import { getCommentRoot } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { removeWorkListItem, workListStyles } from '../../../pages/Home/YourWork/WorkListItem';
import { useIntl } from 'react-intl';
import JobDescription from '../JobDescription';
import { formCommentEditReplyLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { findMessageForCommentId } from '../../../utils/messageUtils';
import _ from 'lodash';

function DecideReplyStep(props) {
  const { marketId, commentId, message } = props;
  const history = useHistory();
  const [commentState] = useContext(CommentsContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const commentRoot = getCommentRoot(commentState, marketId, commentId) || {id: 'fake'};
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
  const workItemClasses = workListStyles();

  function myOnFinish() {
    removeWorkListItem(message, workItemClasses.removed, messagesDispatch);
  }

  function dismissAll() {
    threadMessages.forEach((aMessage) => removeWorkListItem(aMessage, workItemClasses.removed, messagesDispatch))
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
        onNext={() => navigate(history, formCommentEditReplyLink(marketId, commentId, true), false,
          true)}
        spinOnClick={false}
        showOtherNext={hasThreadMessages}
        otherNextLabel="notificationDelete"
        onOtherNext={myOnFinish}
        otherSpinOnClick={false}
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