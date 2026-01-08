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
import {
  addCommentToMarket,
  getMarketComments
} from '../../../contexts/CommentsContext/commentsContextHelper';
import {
  getMarketPresences,
  getReasonForVote,
  partialUpdateInvestment
} from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import _ from 'lodash';
import {
  formInvestibleLink, formWizardLink,
  navigate,
  preventDefaultAndProp
} from '../../../utils/marketIdPathFunctions';
import { dismissWorkListItem, removeWorkListItem } from '../../../pages/Home/YourWork/WorkListItem';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import JobDescription from '../JobDescription';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { getMarketInfo } from '../../../utils/userFunctions';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { useHistory } from 'react-router';
import { JOB_STAGE_WIZARD_TYPE } from '../../../constants/markets';
import { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE } from '../../../constants/comments';
import { useIntl } from 'react-intl';
import { getLabelForTerminate, getShowTerminate } from '../../../utils/messageUtils';
import { useInvestibleVoters } from '../../../utils/votingUtils';
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import Link from '@material-ui/core/Link';
import { getFurtherWorkStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { hasJobComment } from '../../AddNewWizards/JobComment/AddCommentStep';

export function getJobApproveEditorName(investibleId) {
  return `jobapproveeditor${investibleId}`;
}
function JobApproveStep(props) {
  const { marketId, updateFormData = () => {}, formData = {}, message, investibleId, yourVote, isAssigned } = props;
  const intl = useIntl();
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [marketPresencesState, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [, messagesDispatch] = useContext(NotificationsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [marketsState] = useContext(MarketsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
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
  const pathToApprovals = `${formInvestibleLink(marketId, investibleId)}#approve`;

  function onNext() {
    const {approveUploadedFiles, approveReason, approveQuantity} = formData;
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(approveUploadedFiles, approveReason);
    const reasonNeedsUpdate = !_.isEmpty(tokensRemoved);
    const updateInfo = {
      marketId,
      investibleId,
      groupId,
      newQuantity: parseInt(approveQuantity),
      currentQuantity: yourVote && !wasDeleted ? yourVote.quantity : 0,
      newReasonText: tokensRemoved,
      reasonNeedsUpdate,
      uploadedFiles: filteredUploads,
      version: yourReason?.version
    };
    if (!reasonNeedsUpdate && yourVote) {
      updateInfo.currentReasonId = yourVote.comment_id;
    }
    return updateInvestment(updateInfo).then((result) => {
      const { commentResult, investmentResult } = result;
      const { commentAction, comment } = commentResult;
      if (commentAction !== "NOOP") {
        addCommentToMarket(comment, commentsState, commentsDispatch);
      }
      partialUpdateInvestment(marketPresencesDispatch, investmentResult, true);
      setOperationRunning(false);
      dismissWorkListItem(message, messagesDispatch);
      navigate(history, pathToApprovals);
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

  function moveToBacklog() {
    const backlogStage = getFurtherWorkStage(marketStagesState, marketId)
    navigate(history,
      `${formWizardLink(JOB_STAGE_WIZARD_TYPE, marketId, investibleId)}&stageId=${backlogStage.id}&typeObjectId=${message.type_object_id}&isAssign=false`);
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
        {intl.formatMessage({ id: isAssigned ? 'ApproveOwnAssignmentFullTitle' : 'AssignmentApprovalTitle' })}
      </Typography>
      {wasDeleted && (
        <Typography className={classes.introSubText} variant="subtitle1">
          Your approval was deleted or expired.
        </Typography>
      )}
      {!wasDeleted && _.isEmpty(voters) && (
        <Typography className={classes.introSubText} variant="subtitle1">
          You are the first approver and approvals expire in {market.investment_expiration} days.
        </Typography>
      )}
      {!wasDeleted && !_.isEmpty(voters) && !isAssigned && (
        <Typography className={classes.introSubText} variant="subtitle1">
          There are <b>{_.size(voters)}</b> <Link href={pathToApprovals} onClick={(event) => {
          preventDefaultAndProp(event);
          navigate(history, pathToApprovals);
        }}>existing approvals</Link>. Approvals expire in {market.investment_expiration} days.
        </Typography>
      )}
      {!wasDeleted && !_.isEmpty(voters) && isAssigned && (
        <Typography className={classes.introSubText} variant="subtitle1">
          Approve to mark your acceptance. There are <b>{_.size(voters)}</b> <Link href={pathToApprovals} onClick={(event) => {
          preventDefaultAndProp(event);
          navigate(history, pathToApprovals);
        }}>existing approvals</Link>.
        </Typography>
      )}
      <JobDescription marketId={marketId} investibleId={investibleId} showVoting comments={todos}
                      showRequiredApprovers/>
      <div className={classes.borderBottom}/>
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
        nextLabel={isAssigned ? 'ApprovalWizardAccept' : 'ApprovalWizardApprove'}
        onNext={onNext}
        onNextDoAdvance={false}
        showOtherNext
        otherNextValid
        otherSpinOnClick={false}
        otherNextLabel={wasDeleted ? 'JobAssignBacklog' : 'WizardJobAssistance'}
        onOtherNext={wasDeleted ? moveToBacklog : undefined}
        onOtherNextDoAdvance={!wasDeleted}
        otherNextShowEdit={hasJobComment(groupId, investibleId, QUESTION_TYPE)||
          hasJobComment(groupId, investibleId, SUGGEST_CHANGE_TYPE)||
          hasJobComment(groupId, investibleId, ISSUE_TYPE)}
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

export default JobApproveStep