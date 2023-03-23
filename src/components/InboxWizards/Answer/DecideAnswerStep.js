import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import { getCommentRoot } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { marketAbstain } from '../../../api/markets';
import { changeMyPresence } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { removeMessagesForCommentId } from '../../../utils/messageUtils';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { removeWorkListItem, workListStyles } from '../../../pages/Home/YourWork/WorkListItem';
import { useIntl } from 'react-intl';
import JobDescription from '../JobDescription';

function DecideAnswerStep(props) {
  const { marketId, commentId, clearFormData, message } = props;
  const [commentState] = useContext(CommentsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [marketPresencesState, presenceDispatch] = useContext(MarketPresencesContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const commentRoot = getCommentRoot(commentState, marketId, commentId) || {id: 'fake'};
  const comments = (commentState[marketId] || []).filter((comment) =>
    comment.root_comment_id === commentRoot.id || comment.id === commentRoot.id);
  const classes = wizardStyles();
  const intl = useIntl();
  const workItemClasses = workListStyles();

  function myOnFinish() {
    removeWorkListItem(message, workItemClasses.removed, messagesDispatch);
  }

  function abstain() {
    setOperationRunning(true);
    return marketAbstain(commentRoot.inline_market_id)
      .then(() => {
        const newValues = {
          abstain: true,
        }
        changeMyPresence(marketPresencesState, presenceDispatch, marketId, newValues)
        removeMessagesForCommentId(commentId, messagesState, workItemClasses.removed)
        setOperationRunning(false)
        clearFormData();
      });
  }

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText}>
        {intl.formatMessage({id: 'DecideAnswerTitle'})}
      </Typography>
      {commentRoot.investible_id && (
        <JobDescription marketId={marketId} investibleId={commentRoot.investible_id} comments={comments} />
      )}
      {!commentRoot.investible_id && (
        <div className={classes.wizardCommentBoxDiv}>
          <CommentBox
            comments={comments}
            marketId={marketId}
            allowedTypes={[]}
            isInbox
            removeActions
          />
        </div>
      )}
      <WizardStepButtons
        {...props}
        nextLabel="defer"
        showNext={message.is_highlighted}
        onNext={myOnFinish}
        spinOnClick={false}
        showOtherNext
        otherNextLabel="DecideWizardMute"
        onOtherNext={abstain}
        showTerminate={false}
      />
    </div>
    </WizardStepContainer>
  );
}

DecideAnswerStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

DecideAnswerStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default DecideAnswerStep;