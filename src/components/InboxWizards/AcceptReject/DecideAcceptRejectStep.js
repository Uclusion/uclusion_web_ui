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
import { resolveComment, updateComment } from '../../../api/comments';
import { TODO_TYPE } from '../../../constants/comments';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import JobDescription from '../JobDescription';
import { useHistory } from 'react-router';
import { handleAcceptSuggestion } from '../../../utils/commentFunctions';
import { formCommentLink, navigate } from '../../../utils/marketIdPathFunctions';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { getLabelForTerminate, getShowTerminate } from '../../../utils/messageUtils';

function DecideAcceptRejectStep(props) {
  const { marketId, commentId, message, formData, updateFormData } = props;
  const [commentState] = useContext(CommentsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [investiblesState, investiblesDispatch] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const history = useHistory();
  const commentRoot = getCommentRoot(commentState, marketId, commentId) || {id: 'fake'};
  const comments = (commentState[marketId] || []).filter((comment) =>
    comment.root_comment_id === commentRoot.id || comment.id === commentRoot.id);
  const classes = wizardStyles();
  const { useCompression } = formData;

  function myOnFinish() {
    removeWorkListItem(message, messagesDispatch, history);
  }

  function accept() {
    return updateComment({marketId, commentId, commentType: TODO_TYPE}).then((comment) => {
      const investible = getInvestible(investiblesState, comment.investible_id);
      handleAcceptSuggestion({ isMove: false, comment, investible, investiblesDispatch, marketStagesState,
        commentsState, commentsDispatch, messagesState, messagesDispatch })
      setOperationRunning(false);
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
        Do you accept this suggestion?
      </Typography>
      <JobDescription marketId={marketId} investibleId={commentRoot.investible_id}
                      comments={comments}
                      inboxMessageId={commentId}
                      useCompression={useCompression}
                      toggleCompression={() => updateFormData({ useCompression: !useCompression })}
                      removeActions/>
      <div className={classes.borderBottom}/>
      <WizardStepButtons
        {...props}
        onFinish={myOnFinish}
        nextLabel="wizardAcceptLabel"
        onNext={accept}
        showOtherNext
        otherNextLabel="issueResolveLabel"
        onOtherNext={resolve}
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

DecideAcceptRejectStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default DecideAcceptRejectStep;