import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import AddInitialVote from '../../../pages/Investible/Voting/AddInitialVote';
import { processTextAndFilesForSave } from '../../../api/files';
import { updateInvestment } from '../../../api/marketInvestibles';
import { editorEmpty } from '../../TextEditors/Utilities/CoreUtils';
import { addMarketComments, getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import {
  getMarketPresences,
  getReasonForVote,
  partialUpdateInvestment
} from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import _ from 'lodash';
import { formInvestibleAddCommentLink, formInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';
import { dismissWorkListItem, removeWorkListItem } from '../../../pages/Home/YourWork/WorkListItem';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import JobDescription from '../JobDescription';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { getMarketInfo } from '../../../utils/userFunctions';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { useHistory } from 'react-router';
import { JOB_COMMENT_WIZARD_TYPE } from '../../../constants/markets';
import { ISSUE_TYPE, TODO_TYPE } from '../../../constants/comments';
import { useIntl } from 'react-intl';
import { getLabelForTerminate, getShowTerminate } from '../../../utils/messageUtils';
import { useInvestibleVoters } from '../../../utils/votingUtils';
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';

export function getJobApproveEditorName(investibleId) {
  return `jobapproveeditor${investibleId}`;
}
function JobApproveStep(props) {
  const { marketId, updateFormData, formData, message, investibleId, yourVote, isAssigned } = props;
  const intl = useIntl();
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [marketPresencesState, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [, messagesDispatch] = useContext(NotificationsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [marketsState] = useContext(MarketsContext);
  const market = getMarket(marketsState, marketId) || {};
  const history = useHistory();
  const validForm = formData.approveQuantity != null;
  const classes = wizardStyles();
  const editorName = getJobApproveEditorName(investibleId);
  const wasDeleted = yourVote?.deleted;
  const inv = getInvestible(investiblesState, investibleId);
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { group_id: groupId } = marketInfo;
  const marketComments = getMarketComments(commentsState, marketId, marketInfo.group_id);
  const todos = marketComments.filter((comment) => comment.comment_type === TODO_TYPE &&
    comment.investible_id === investibleId);
  const yourReason = getReasonForVote(yourVote, marketComments);
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const voters = useInvestibleVoters(marketPresences, investibleId, marketId);

  function onNext() {
    const {approveUploadedFiles, approveReason, approveQuantity} = formData;
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(approveUploadedFiles, approveReason);

    const updateInfo = {
      marketId,
      investibleId,
      groupId,
      newQuantity: parseInt(approveQuantity),
      currentQuantity: yourVote && !wasDeleted ? yourVote.quantity : 0,
      newReasonText: tokensRemoved,
      reasonNeedsUpdate: !_.isEmpty(tokensRemoved),
      uploadedFiles: filteredUploads
    };
    return updateInvestment(updateInfo).then((result) => {
      const { commentResult, investmentResult } = result;
      const { commentAction, comment } = commentResult;
      if (commentAction !== "NOOP") {
        addMarketComments(commentsDispatch, marketId, [comment]);
      }
      partialUpdateInvestment(marketPresencesDispatch, investmentResult, true);
      setOperationRunning(false);
      dismissWorkListItem(message, messagesDispatch);
      navigate(history, formInvestibleLink(marketId, investibleId));
    })
  }

  function onApproveChange (key) {
    return (data) => {
      const update = {
        [key]: data,
      };
      updateFormData(update);
    };
  }


  function onQuantityChange(event) {
    const {value} = event.target;
    updateFormData({
      approveQuantity: parseInt(value, 10)
    });
  }

  const {approveQuantity} = formData;

  function onFinish() {
    removeWorkListItem(message, messagesDispatch, history);
  }

  return (
    <WizardStepContainer
      {...props}
    >
        <Typography className={classes.introText} variant="h6">
          {intl.formatMessage({id: isAssigned ? 'ApproveOwnAssignmentFullTitle' : 'AssignmentApprovalTitle'})}
        </Typography>
        {wasDeleted && (
          <Typography className={classes.introSubText} variant="subtitle1">
            Your approval was deleted or expired.
          </Typography>
        )}
        {!wasDeleted && _.isEmpty(voters) && (
          <Typography className={classes.introSubText} variant="subtitle1">
            Take action here or click the job title to ask a question or make a suggestion. Your approval will expire
            in {market.investment_expiration} days.
          </Typography>
        )}
        {!wasDeleted && !_.isEmpty(voters) && (
          <Typography className={classes.introSubText} variant="subtitle1">
            Take action here or click the job title to ask a question, make a suggestion, or
            see <b>{_.size(voters)} existing approvals</b>. Your approval will expire
            in {market.investment_expiration} days.
          </Typography>
        )}
        <JobDescription marketId={marketId} investibleId={investibleId} showVoting comments={todos}
                        showRequiredApprovers />
        <div style={{marginBottom: '1rem'}}/>
        <AddInitialVote
          marketId={marketId}
          onChange={onQuantityChange}
          newQuantity={approveQuantity}
          onEditorChange={onApproveChange('approveReason')}
          onUpload={onApproveChange('approveUploadedFiles')}
          editorName={editorName}
          defaultReason={!editorEmpty(yourReason?.body) ? yourReason?.body : undefined}
          isInbox
        />
        <div className={classes.borderBottom}/>
        <WizardStepButtons
          {...props}
          onFinish={onFinish}
          validForm={validForm}
          nextLabel={isAssigned ? 'ApprovalWizardAccept' : 'yourVotingVoteForThisPlanning'}
          onNext={onNext}
          showOtherNext
          otherNextValid
          otherSpinOnClick={false}
          otherNextLabel="ApprovalWizardBlock"
          onOtherNext={() => navigate(history,
            formInvestibleAddCommentLink(JOB_COMMENT_WIZARD_TYPE, investibleId, marketId, ISSUE_TYPE))}
          isOtherFinal={false}
          showTerminate={getShowTerminate(message)}
          terminateLabel={getLabelForTerminate(message)}
        />
    </WizardStepContainer>
  )
}

JobApproveStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
}

JobApproveStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
}

export default JobApproveStep