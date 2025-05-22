import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import JobDescription from '../JobDescription';
import {
  addCommentToMarket,
  getComment,
  getInvestibleComments
} from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { useHistory } from 'react-router';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { useIntl } from 'react-intl';
import { dismissWorkListItem, removeWorkListItem } from '../../../pages/Home/YourWork/WorkListItem';
import { getLabelForTerminate, getShowTerminate } from '../../../utils/messageUtils';
import { updateComment } from '../../../api/comments';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { formCommentLink, formWizardLink, navigate } from '../../../utils/marketIdPathFunctions';
import { REPLY_WIZARD_TYPE } from '../../../constants/markets';
import { hasReply } from '../../AddNewWizards/Reply/ReplyStep';
import _ from 'lodash';

function TaskReviewStep(props) {
  const { marketId, message, formData, updateFormData } = props;
  const classes = wizardStyles();
  const history = useHistory();
  const intl = useIntl();
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [, messagesDispatch] = useContext(NotificationsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const commentList = _.isEmpty(message.comment_list) ? [message.comment_id] :
    _.uniq([message.comment_id].concat(message.comment_list));
  const commentId = commentList[0];
  const comment = getComment(commentsState, marketId, commentId);
  const investibleComments = getInvestibleComments(comment.investible_id, marketId, commentsState);
  const tasksAndChildren = investibleComments.filter((aComment) => {
    return commentList.includes(aComment.id) || commentList.includes(aComment.root_comment_id);
  }) || [];
  const { useCompression } = formData;
  const isSingleTaskDisplay = _.size(commentList) === 1;

  function markInProgress() {
    return updateComment({marketId, commentId, inProgress: true}).then((comment) => {
      setOperationRunning(false);
      addCommentToMarket(comment, commentsState, commentsDispatch);
      dismissWorkListItem(message, messagesDispatch);
      navigate(history, formCommentLink(marketId, comment.group_id, comment.investible_id, comment.id));
    });
  }

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        {intl.formatMessage({ id: isSingleTaskDisplay ? 'NewTaskTitle' : 'NewTasksTitle' })}
      </Typography>
      {!isSingleTaskDisplay && (
        <Typography className={classes.introSubText} variant="subtitle1">
          Click on a row below to expand and reply or take other actions.
        </Typography>
      )}
      <JobDescription marketId={marketId} investibleId={comment.investible_id} comments={tasksAndChildren}
                      useCompression={useCompression} inboxMessageId={isSingleTaskDisplay ? commentId : undefined}
                      toggleCompression={() => updateFormData({ useCompression: !useCompression })}
                      tasksDefaultOpen removeActions={isSingleTaskDisplay} isSingleTaskDisplay={isSingleTaskDisplay}/>
      <div className={classes.borderBottom}/>
      {isSingleTaskDisplay && (
        <WizardStepButtons
          {...props}
          focus
          nextLabel="issueReplyLabel"
          onNext={() => navigate(history, formWizardLink(REPLY_WIZARD_TYPE, marketId,
            undefined, undefined, commentId, message.type_object_id))}
          nextShowEdit={hasReply(getComment(commentsState, marketId, commentId))}
          spinOnClick={false}
          showOtherNext
          onOtherNext={markInProgress}
          otherNextLabel="markInProgress"
          isOtherFinal
          onOtherNextDoAdvance={false}
          terminateLabel={getLabelForTerminate(message)}
          showTerminate={getShowTerminate(message)}
          onFinish={() => removeWorkListItem(message, messagesDispatch, history)}
        />
      )}
      {!isSingleTaskDisplay && (
        <WizardStepButtons
          {...props}
          showNext={false}
          terminateLabel={getLabelForTerminate(message)}
          showTerminate={getShowTerminate(message)}
          onFinish={() => removeWorkListItem(message, messagesDispatch, history)}
        />
      )}
    </WizardStepContainer>
  );
}

TaskReviewStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

TaskReviewStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default TaskReviewStep;