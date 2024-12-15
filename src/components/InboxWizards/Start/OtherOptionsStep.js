import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import { addCommentToMarket, getComment } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { useHistory } from 'react-router';
import { formWizardLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useIntl } from 'react-intl';
import { dismissWorkListItem } from '../../../pages/Home/YourWork/WorkListItem';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { REPLY_WIZARD_TYPE } from '../../../constants/markets';
import { resolveComment } from '../../../api/comments';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { hasReply } from '../../AddNewWizards/Reply/ReplyStep';

function OtherOptionsStep(props) {
  const { marketId, commentId, message, updateFormData, formData } = props;
  const [commentState, commentsDispatch] = useContext(CommentsContext);
  const [, messagesDispatch] = useContext(NotificationsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const intl = useIntl();
  const history = useHistory();
  const commentRoot = getComment(commentState, marketId, commentId) || {id: 'fake'};
  const comments = (commentState[marketId] || []).filter((comment) =>
    comment.root_comment_id === commentRoot.id || comment.id === commentRoot.id);
  const classes = wizardStyles();
  const { useCompression } = formData;

  function resolve() {
    return resolveComment(marketId, commentId)
      .then((comment) => {
        addCommentToMarket(comment, commentState, commentsDispatch);
        setOperationRunning(false);
        dismissWorkListItem(message, messagesDispatch, history);
      });
  }

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        {intl.formatMessage({id: 'DecideStartTitle'})}
      </Typography>
      <div className={classes.wizardCommentBoxDiv}>
        <CommentBox
          comments={comments}
          marketId={marketId}
          allowedTypes={[]}
          isInbox
          inboxMessageId={commentId}
          compressAll
          removeActions
          toggleCompression={() => updateFormData({useCompression: !useCompression})}
          useCompression={useCompression}
        />
      </div>
      <WizardStepButtons
        {...props}
        focus
        nextLabel="DecideStartBugExisting"
        spinOnClick={false}
        isFinal={false}
        showOtherNext
        otherSpinOnClick={false}
        onOtherNext={() => navigate(history, formWizardLink(REPLY_WIZARD_TYPE, marketId,
          undefined, undefined, commentId, message.type_object_id))}
        otherNextShowEdit={hasReply(getComment(commentState, marketId, commentId))}
        onOtherNextDoAdvance={false}
        otherNextLabel="issueReplyLabel"
        terminateLabel="issueResolveLabel"
        showTerminate
        terminateSpinOnClick
        onFinish={resolve}
      />
    </WizardStepContainer>
  );
}

OtherOptionsStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

OtherOptionsStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default OtherOptionsStep;