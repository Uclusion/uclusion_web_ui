import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import WizardStepContainer from '../WizardStepContainer'
import { wizardStyles } from '../WizardStylesContext'
import WizardStepButtons from '../WizardStepButtons'
import JobDescription from '../JobDescription'
import { REPORT_TYPE, TODO_TYPE } from '../../../constants/comments'
import { getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper'
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'
import { wizardFinish } from '../InboxWizardUtils';
import { formInvestibleLink } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { getCommentsSortedByType } from '../../../utils/commentFunctions';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';

function DecideReviewStep(props) {
  const { marketId, investibleId, message, updateFormData, clearFormData } = props;
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const classes = wizardStyles();
  const history = useHistory();
  const [commentsState] = useContext(CommentsContext);
  const [, messagesDispatch] = useContext(NotificationsContext);
  const isUnread = message.type_object_id.startsWith('UNREAD');
  const marketComments = getMarketComments(commentsState, marketId);
  const comments = getCommentsSortedByType(marketComments, investibleId, true);

  function goToJob() {
    clearFormData();
    wizardFinish( { link: formInvestibleLink(marketId, investibleId) }, setOperationRunning, message,
      history, marketId, investibleId, messagesDispatch);
  }

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText}>
        How will you review this job?
      </Typography>
      {!isUnread && (
        <Typography className={classes.introSubText} variant="subtitle1">
          You are a required reviewer.
        </Typography>
      )}
      <JobDescription marketId={marketId} investibleId={investibleId} comments={comments} />
      <WizardStepButtons
        {...props}
        nextLabel="DecideAddReview"
        onNext={() => updateFormData({ commentType: REPORT_TYPE })}
        showOtherNext
        onOtherNext={() => updateFormData({ commentType: TODO_TYPE })}
        otherNextLabel="DecideAddTask"
        terminateLabel="JobWizardGotoJob"
        showTerminate={true}
        onFinish={goToJob}
      />
    </div>
    </WizardStepContainer>
  );
}

DecideReviewStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

DecideReviewStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default DecideReviewStep;