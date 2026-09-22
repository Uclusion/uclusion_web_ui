import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { getCommentRoot, getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { removeWorkListItem } from '../../../pages/Home/YourWork/WorkListItem';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import JobDescription from '../JobDescription';
import { useHistory } from 'react-router';
import { getLabelForTerminate, getShowTerminate } from '../../../utils/messageUtils';

function DecideAcceptRejectStep(props) {
  const { marketId, commentId, message, formData = {}, updateFormData = () => {} } = props;
  const [commentState] = useContext(CommentsContext);
  const [, messagesDispatch] = useContext(NotificationsContext);
  const history = useHistory();
  const commentRoot = getCommentRoot(commentState, marketId, commentId) || {id: 'fake'};
  const comments = getMarketComments(commentState, marketId).filter((comment) =>
    comment.root_comment_id === commentRoot.id || comment.id === commentRoot.id);
  const classes = wizardStyles();
  const { useCompression } = formData;

  function myOnFinish() {
    removeWorkListItem(message, messagesDispatch, history);
  }

  return (
    <WizardStepContainer
      {...props}
    >
      <JobDescription marketId={marketId} investibleId={commentRoot.investible_id}
                      comments={comments}
                      inboxMessageId={commentId}
                      useCompression={useCompression}
                      toggleCompression={() => updateFormData({ useCompression: !useCompression })} />
      <div className={classes.borderBottom}/>
      <WizardStepButtons
        {...props}
        focus
        showNext={false}
        onFinish={myOnFinish}
        showTerminate={getShowTerminate(message)}
        terminateLabel={getLabelForTerminate(message)}
      />
    </WizardStepContainer>
  );
}

DecideAcceptRejectStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

export default DecideAcceptRejectStep;
