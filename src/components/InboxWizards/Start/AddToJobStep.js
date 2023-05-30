import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import WizardStepButtons from '../WizardStepButtons';
import { formCommentLink } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { addMarketComments, getComment } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import _ from 'lodash';
import { moveComments } from '../../../api/comments';
import { removeMessagesForCommentId } from '../../../utils/messageUtils';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import ChooseJob from '../../Search/ChooseJob';
import {
  getStages,
  isNotDoingStage,
  isVerifiedStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { wizardStyles } from '../WizardStylesContext';
import { wizardFinish } from '../InboxWizardUtils';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { removeWorkListItem } from '../../../pages/Home/YourWork/WorkListItem';

function FindJobStep(props) {
  const { marketId, commentId, updateFormData, formData, message } = props;
  const history = useHistory();
  const classes = wizardStyles();
  const [commentState, commentsDispatch] = useContext(CommentsContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const { investibleId } = formData;
  const commentRoot = getComment(commentState, marketId, commentId) || {id: 'fake'};
  const comments = (commentState[marketId] || []).filter((comment) =>
    comment.root_comment_id === commentRoot.id || comment.id === commentRoot.id);
  const marketStages = getStages(marketStagesState, marketId);
  const activeMarketStages = marketStages.filter((stage) => {
    return !isVerifiedStage(stage) && !isNotDoingStage(stage);
  });
  const groupId = commentRoot.group_id;

  function myTerminate() {
    removeWorkListItem(message, messagesDispatch, history);
  }

  function onNext(doStayInInbox) {
    return moveComments(marketId, investibleId, [commentId])
      .then((movedComments) => {
        removeMessagesForCommentId(commentId, messagesState);
        const fixedThread = comments.map((aComment) => {
          return {investible_id: investibleId, ...aComment};
        });
        addMarketComments(commentsDispatch, marketId, [...movedComments, ...fixedThread]);
        if (doStayInInbox) {
          setOperationRunning(false);
          myTerminate();
        } else {
          const link = formCommentLink(marketId, groupId, investibleId, commentId);
          wizardFinish({ link }, setOperationRunning, message, history, marketId, investibleId,
            messagesDispatch);
        }
      });
  }

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
      <div>
        <Typography className={classes.introText} variant="h6">
          Which active job in this group?
        </Typography>
        <ChooseJob
          marketId={marketId}
          groupId={groupId}
          formData={formData}
          marketStages={activeMarketStages}
          onChange={(id) => {
            updateFormData({ investibleId: id })
          }}
        />
        <div className={classes.borderBottom}/>
        <WizardStepButtons
          {...props}
          validForm={!_.isEmpty(investibleId)}
          onNext={() => onNext(true)}
          showOtherNext
          nextLabel="storyFromComment"
          onOtherNext={() => onNext(false)}
          otherNextLabel="storyFromCommentNav"
          terminateLabel={ message.type_object_id.startsWith('UNREAD') ? 'notificationDismiss' : 'defer' }
          showTerminate={message.type_object_id.startsWith('UNREAD') || message.is_highlighted}
          onFinish={myTerminate}
        />
      </div>
    </WizardStepContainer>
  )
}

FindJobStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
}

FindJobStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
}

export default FindJobStep