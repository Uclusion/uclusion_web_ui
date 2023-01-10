import React, { useContext } from 'react';
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext'
import WizardStepButtons from '../WizardStepButtons';
import JobDescription from '../JobDescription'
import { ISSUE_TYPE } from '../../CardType'
import { getMyUserForMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { getMarketInfo } from '../../../utils/userFunctions';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { wizardFinish } from '../InboxWizardUtils';
import { formInvestibleLink } from '../../../utils/marketIdPathFunctions';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { useHistory } from 'react-router';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { getCommentsSortedByType } from '../../../utils/commentFunctions';
import { JUSTIFY_TYPE } from '../../../constants/comments';
import { editorEmpty } from '../../TextEditors/Utilities/CoreUtils';
import { setUclusionLocalStorageItem } from '../../localStorageUtils';
import { getJobApproveEditorName } from './JobApproveStep';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';


function JobDescriptionStep (props) {
  const { marketId, investibleId, updateFormData, message, yourVote } = props;
  const classes = wizardStyles();
  const [investiblesState] = useContext(InvestiblesContext);
  const [marketsState] = useContext(MarketsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [commentsState] = useContext(CommentsContext);
  const [, messagesDispatch] = useContext(NotificationsContext);
  const marketComments = getMarketComments(commentsState, marketId);
  const comments = getCommentsSortedByType(marketComments, investibleId, false);
  const history = useHistory();
  const inv = getInvestible(investiblesState, investibleId);
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const userId = getMyUserForMarket(marketsState, marketId);
  const { assigned } = marketInfo || {};
  const isAssigned = (assigned || []).includes(userId);
  const wasDeleted = yourVote && yourVote.deleted;
  const yourReason = comments.find((comment) => comment.created_by === userId && comment.investible_id === investibleId
    && comment.comment_type === JUSTIFY_TYPE);

  function myOnFinish() {
    wizardFinish({link: `${formInvestibleLink(marketId, investibleId)}#approve`},
      setOperationRunning, message, history, marketId, investibleId, messagesDispatch);
  }

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText}>
        Should this job be done now?
      </Typography>
      {wasDeleted && (
        <Typography className={classes.introSubText} variant="subtitle1">
          Your approval was deleted or expired.
        </Typography>
      )}
      {!wasDeleted && isAssigned && (
        <Typography className={classes.introSubText} variant="subtitle1">
          Keep in mind that you are assigned to this job.
        </Typography>
      )}
      <JobDescription marketId={marketId} investibleId={investibleId} comments={comments} />
      <WizardStepButtons
        {...props}
        nextLabel="ApprovalWizardApprove"
        showOtherNext
        otherNextLabel="ApprovalWizardBlock"
        onOtherNext={() => updateFormData({ commentType: ISSUE_TYPE })}
        onNext={() => {
          const { body } = yourReason || {};
          if (!editorEmpty(body)) {
            setUclusionLocalStorageItem(getJobApproveEditorName(investibleId), body);
          }
          updateFormData({
            isApprove: true, investibleId,
            approveQuantity: yourVote ? yourVote.quantity : undefined
          });
        }}
        showTerminate={true}
        onFinish={myOnFinish}
        terminateLabel="ApproveWizardGotoJob"/>
    </div>
    </WizardStepContainer>
  );
}

JobDescriptionStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

JobDescriptionStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default JobDescriptionStep;