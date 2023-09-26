import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import WizardStepButtons from '../WizardStepButtons';
import { formCommentLink } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { getComment } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import _ from 'lodash';
import { moveComments } from '../../../api/comments';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import ChooseJob from '../../Search/ChooseJob';
import {
  getStages,
  isInReviewStage,
  isNotDoingStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { wizardStyles } from '../WizardStylesContext';
import { wizardFinish } from '../InboxWizardUtils';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { removeWorkListItem } from '../../../pages/Home/YourWork/WorkListItem';
import { getGroup } from '../../../contexts/MarketGroupsContext/marketGroupsContextHelper';
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext';
import { onCommentsMove } from '../../../utils/commentFunctions';

function FindJobStep(props) {
  const { marketId, commentId, updateFormData, formData, message } = props;
  const history = useHistory();
  const classes = wizardStyles();
  const [commentState, commentsDispatch] = useContext(CommentsContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [groupState] = useContext(MarketGroupsContext);
  const { investibleId } = formData;
  const commentRoot = getComment(commentState, marketId, commentId) || {id: 'fake'};
  const comments = (commentState[marketId] || []).filter((comment) =>
    comment.root_comment_id === commentRoot.id || comment.id === commentRoot.id);
  const marketStages = getStages(marketStagesState, marketId);
  const activeMarketStages = marketStages.filter((stage) => {
    return !isInReviewStage(stage) && !isNotDoingStage(stage);
  });
  const groupId = commentRoot.group_id;
  const group = getGroup(groupState, marketId, groupId) || {};

  function myTerminate() {
    removeWorkListItem(message, messagesDispatch, history);
  }

  function onNext(doStayInInbox) {
    return moveComments(marketId, investibleId, [commentId])
      .then((movedComments) => {
        onCommentsMove([commentId], messagesState, comments, investibleId, commentsDispatch,
          marketId, movedComments, messagesDispatch);
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
        <Typography className={classes.introText} variant="h6">
          Which active job in group {group.name}?
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