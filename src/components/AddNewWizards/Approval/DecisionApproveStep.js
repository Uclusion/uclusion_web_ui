import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import WizardStepContainer from '../WizardStepContainer'
import { WizardStylesContext } from '../WizardStylesContext'
import WizardStepButtons from '../WizardStepButtons'
import { formCommentLink, navigate, navigateToOption } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router'
import AddInitialVote from '../../../pages/Investible/Voting/AddInitialVote';
import { processTextAndFilesForSave } from '../../../api/files';
import { removeInvestment, updateInvestment } from '../../../api/marketInvestibles';
import { resetEditor } from '../../TextEditors/Utilities/CoreUtils';
import {
  getComment,
  getMarketComments,
  refreshMarketComments
} from '../../../contexts/CommentsContext/commentsContextHelper';
import {
  partialUpdateInvestment
} from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import _ from 'lodash'
import { getJobApproveEditorName } from '../../InboxWizards/Approval/JobApproveStep';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { removeWorkListItem, workListStyles } from '../../../pages/Home/YourWork/WorkListItem';
import { findMessageOfType } from '../../../utils/messageUtils';
import { NOT_FULLY_VOTED_TYPE } from '../../../constants/notifications';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';

function DecisionApproveStep(props) {
  const { market, clearFormData, updateFormData, formData, investibleId, hasOtherVote } = props;
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const workItemClasses = workListStyles();
  const history = useHistory();
  const classes = useContext(WizardStylesContext);
  const editorName = getJobApproveEditorName(investibleId);
  const marketId = market.id;
  const {approveUploadedFiles, approveReason, approveQuantity, originalQuantity, wasDeleted, showDelete} = formData;
  const validForm = approveQuantity >= 0;
  const { parent_comment_id: parentCommentId, parent_comment_market_id: parentMarketId,
    allow_multi_vote: allowsMultiple } = market;
  const parentComment = getComment(commentsState, parentMarketId, parentCommentId) || {};
  const { investible_id: parentInvestibleId, group_id: parentGroupId } = parentComment;

  function doQuick(result) {
    const { commentResult, investmentResult } = result;
    const { commentAction, comment } = commentResult;
    if (commentAction !== 'NOOP') {
      const comments = getMarketComments(commentsState, marketId);
      refreshMarketComments(commentsDispatch, marketId, [comment, ...comments]);
    }
    partialUpdateInvestment(marketPresencesDispatch, investmentResult, true);
    const voteMessage = findMessageOfType(NOT_FULLY_VOTED_TYPE, marketId, messagesState);
    if (voteMessage) {
      removeWorkListItem(voteMessage, workItemClasses.removed, messagesDispatch);
    }
    clearFormData();
    setOperationRunning(false);
  }

  function onNext() {
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(approveUploadedFiles, approveReason);

    const updateInfo = {
      marketId,
      investibleId,
      groupId: marketId,
      newQuantity: approveQuantity,
      currentQuantity: wasDeleted ? 0 : originalQuantity,
      newReasonText: tokensRemoved,
      reasonNeedsUpdate: !_.isEmpty(tokensRemoved),
      uploadedFiles: filteredUploads
    };
    return updateInvestment(updateInfo).then((result) => {
      doQuick(result);
      navigateToOption(history, parentMarketId, parentInvestibleId, parentGroupId, investibleId);
    })
  }

  function onRemove() {
    return removeInvestment(marketId, investibleId).then(result => {
      doQuick(result);
      setOperationRunning(false);
      navigate(history, formCommentLink(parentMarketId, parentGroupId, parentInvestibleId, parentCommentId));
    });
  }

  function onTerminate() {
    clearFormData();
    resetEditor(editorName);
    navigateToOption(history, parentMarketId, parentInvestibleId, parentGroupId, investibleId);
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

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
      <div>
        <Typography className={classes.introText} variant="h6">
          How certain are you of this option?
        </Typography>
        {allowsMultiple && !wasDeleted && (
          <Typography className={classes.introSubText} variant="subtitle1">
            You can vote for more than one option.
          </Typography>
        )}
        {hasOtherVote && !allowsMultiple && !wasDeleted && (
          <Typography className={classes.introSubText} variant="subtitle1">
            Voting for this option clears your previous vote.
          </Typography>
        )}
        {wasDeleted && (
          <Typography className={classes.introSubText} variant="subtitle1">
            Your approval was deleted.
          </Typography>
        )}
        <AddInitialVote
          marketId={marketId}
          onBudgetChange={() => {}}
          showBudget={false}
          onChange={onQuantityChange}
          newQuantity={approveQuantity}
          onEditorChange={onApproveChange('approveReason')}
          onUpload={onApproveChange('approveUploadedFiles')}
          defaultReason={approveReason}
          editorName={editorName}
        />
        <div className={classes.borderBottom}/>
        <WizardStepButtons
          {...props}
          validForm={validForm}
          showTerminate={true}
          showOtherNext={showDelete}
          onOtherNext={onRemove}
          otherNextLabel="commentRemoveLabel"
          onNext={onNext}
          onTerminate={onTerminate}
          terminateLabel="DecisionCommmentWizardTerminate"
          nextLabel="DecisionWizardApprove"
        />
      </div>
    </WizardStepContainer>
  )
}

DecisionApproveStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
}

DecisionApproveStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
}

export default DecisionApproveStep