import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import WizardStepButtons from '../WizardStepButtons';
import { formCommentLink } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { getComment, getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import _ from 'lodash';
import { moveComments } from '../../../api/comments';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import ChooseJob from '../../Search/ChooseJob';
import { wizardStyles } from '../WizardStylesContext';
import { wizardFinish } from '../InboxWizardUtils';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { removeWorkListItem } from '../../../pages/Home/YourWork/WorkListItem';
import { onCommentsMove } from '../../../utils/commentFunctions';
import { getGroupPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { GroupMembersContext } from '../../../contexts/GroupMembersContext/GroupMembersContext';
import { getGroup } from '../../../contexts/MarketGroupsContext/marketGroupsContextHelper';
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { isAutonomousGroup } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';

function FindJobStep(props) {
  const { marketId, commentId, updateFormData, formData, message } = props;
  const history = useHistory();
  const classes = wizardStyles();
  const [commentState, commentsDispatch] = useContext(CommentsContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const { investibleId } = formData;
  const [groupsState] = useContext(MarketGroupsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [groupPresencesState] = useContext(GroupMembersContext);
  const commentRoot = getComment(commentState, marketId, commentId) || {id: 'fake'};
  const comments = getMarketComments(commentState, marketId).filter((comment) =>
    comment.root_comment_id === commentRoot.id || comment.id === commentRoot.id);
  const groupId = commentRoot.group_id;
  const group = getGroup(groupsState, marketId, groupId);
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const groupPresences = getGroupPresences(marketPresences, groupPresencesState, marketId, groupId);
  const isAutonomous = isAutonomousGroup(groupPresences, group);

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

  if (_.isEmpty(group)||_.isEmpty(groupPresences)) {
    // Wait until know if group is autonomous to render choose job widget
    return React.Fragment;
  }

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
        <Typography className={classes.introText} variant="h6">
          Move to which job?
        </Typography>
        <ChooseJob
          marketId={marketId}
          groupId={groupId}
          formData={formData}
          isAutonomous={isAutonomous}
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
          terminateLabel="notificationDismiss"
          showTerminate={message.type_object_id.startsWith('UNREAD')}
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