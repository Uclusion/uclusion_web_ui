import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { getCommentRoot } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { removeWorkListItem, workListStyles } from '../../../pages/Home/YourWork/WorkListItem';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import JobDescription from '../JobDescription';
import { useIntl } from 'react-intl';
import { formCommentEditReplyLink, formWizardLink, navigate } from '../../../utils/marketIdPathFunctions';
import { JOB_STAGE_WIZARD_TYPE } from '../../../constants/markets';
import { useHistory } from 'react-router';

function DecideFeedbackStep(props) {
  const { marketId, commentId, message } = props;
  const intl = useIntl();
  const history = useHistory();
  const [commentState] = useContext(CommentsContext);
  const [, messagesDispatch] = useContext(NotificationsContext);
  const commentRoot = getCommentRoot(commentState, marketId, commentId) || {id: 'fake'};
  const comments = (commentState[marketId] || []).filter((comment) =>
    comment.root_comment_id === commentRoot.id || comment.id === commentRoot.id);
  const classes = wizardStyles();
  const workItemClasses = workListStyles();

  function myOnFinish() {
    removeWorkListItem(message, workItemClasses.removed, messagesDispatch);
  }

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText}>
        {intl.formatMessage({id: 'DecideFeedbackTitle'})}
      </Typography>
      <JobDescription marketId={marketId} investibleId={commentRoot.investible_id} comments={comments} />
      <WizardStepButtons
        {...props}
        onFinish={myOnFinish}
        nextLabel="changeStage"
        spinOnClick={false}
        onNext={() => navigate(history, formWizardLink(JOB_STAGE_WIZARD_TYPE, marketId,
          commentRoot.investible_id))}
        showOtherNext
        otherNextLabel="issueReplyLabel"
        otherSpinOnClick={false}
        onOtherNext={() => navigate(history, formCommentEditReplyLink(marketId, commentId, true),
          false, true)}
        showTerminate={message.type_object_id.startsWith('UNREAD') || message.is_highlighted}
        terminateLabel={message.type_object_id.startsWith('UNREAD') ? 'notificationDelete' : 'defer'}
      />
    </div>
    </WizardStepContainer>
  );
}

DecideFeedbackStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

DecideFeedbackStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default DecideFeedbackStep;