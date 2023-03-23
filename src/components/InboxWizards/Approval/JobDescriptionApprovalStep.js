import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import JobDescription from '../JobDescription';
import { getMyUserForMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { getMarketInfo } from '../../../utils/userFunctions';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { formInvestibleAddCommentLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { getCommentsSortedByType } from '../../../utils/commentFunctions';
import { ISSUE_TYPE } from '../../../constants/comments';
import { editorEmpty } from '../../TextEditors/Utilities/CoreUtils';
import { setUclusionLocalStorageItem } from '../../localStorageUtils';
import { getJobApproveEditorName } from './JobApproveStep';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { useIntl } from 'react-intl';
import { JOB_COMMENT_WIZARD_TYPE } from '../../../constants/markets';
import { getReasonForVote } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { removeWorkListItem, workListStyles } from '../../../pages/Home/YourWork/WorkListItem';

function JobDescriptionStep (props) {
  const { marketId, investibleId, updateFormData, message, yourVote } = props;
  const classes = wizardStyles();
  const workItemClasses = workListStyles();
  const [investiblesState] = useContext(InvestiblesContext);
  const [marketsState] = useContext(MarketsContext);
  const [commentsState] = useContext(CommentsContext);
  const [, messagesDispatch] = useContext(NotificationsContext);
  const marketComments = getMarketComments(commentsState, marketId);
  const comments = getCommentsSortedByType(marketComments, investibleId, false);
  const history = useHistory();
  const intl = useIntl();
  const inv = getInvestible(investiblesState, investibleId);
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const userId = getMyUserForMarket(marketsState, marketId);
  const { assigned } = marketInfo || {};
  const isAssigned = (assigned || []).includes(userId);
  const wasDeleted = yourVote && yourVote.deleted;
  const yourReason = getReasonForVote(yourVote, marketComments);

  function myOnFinish() {
    removeWorkListItem(message, workItemClasses.removed, messagesDispatch);
  }

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText}>
        {intl.formatMessage({id: 'JobApprovalTitle'})}
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
      {!wasDeleted && !isAssigned && (
        <Typography className={classes.introSubText} variant="subtitle1">
          Go to job to ask a question or make a suggestion.
        </Typography>
      )}
      <JobDescription marketId={marketId} investibleId={investibleId} comments={comments} />
      <WizardStepButtons
        {...props}
        nextLabel="ApprovalWizardApprove"
        showOtherNext
        otherNextLabel="ApprovalWizardBlock"
        onOtherNext={() => navigate(history,
          formInvestibleAddCommentLink(JOB_COMMENT_WIZARD_TYPE, investibleId, marketId, ISSUE_TYPE))}
        onNext={() => {
          const { body } = yourReason || {};
          if (!editorEmpty(body)) {
            setUclusionLocalStorageItem(getJobApproveEditorName(investibleId), body);
          }
          updateFormData({
            approveQuantity: yourVote ? yourVote.quantity : undefined
          });
        }}
        spinOnClick={false}
        otherSpinOnClick={false}
        showTerminate={message.is_highlighted}
        onFinish={myOnFinish}
        terminateLabel="defer"/>
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