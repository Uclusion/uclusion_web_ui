import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { formInvestibleAddCommentLink, navigate, navigateToOption } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import AddInitialVote from '../../../pages/Investible/Voting/AddInitialVote';
import { processTextAndFilesForSave } from '../../../api/files';
import { updateInvestment } from '../../../api/marketInvestibles';
import { getComment } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import _ from 'lodash';
import { getJobApproveEditorName } from '../../InboxWizards/Approval/JobApproveStep';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { commonQuick } from './ApprovalWizard';
import JobDescription from '../../InboxWizards/JobDescription';
import { DECISION_COMMENT_WIZARD_TYPE } from '../../../constants/markets';
import { ISSUE_TYPE } from '../../../constants/comments';
import { hasDecisionComment } from '../DecisionComment/AddCommentStep';

function DecisionApproveStep(props) {
  const { market, updateFormData, formData, investibleId, hasOtherVote, currentReasonId } = props;
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const history = useHistory();
  const classes = useContext(WizardStylesContext);
  const editorName = getJobApproveEditorName(investibleId);
  const marketId = market.id;
  const {approveUploadedFiles, approveReason, approveReasonVersion, approveQuantity, originalQuantity, wasDeleted, originalReason} = formData;
  const validForm = approveQuantity > 0;
  const { parent_comment_id: parentCommentId, parent_comment_market_id: parentMarketId,
    allow_multi_vote: allowsMultiple } = market;
  const parentComment = getComment(commentsState, parentMarketId, parentCommentId) || {};
  const { investible_id: parentInvestibleId, group_id: parentGroupId } = parentComment;

  function doQuick(result) {
    commonQuick(result, commentsDispatch, marketId, commentsState, marketPresencesDispatch, messagesState,
      messagesDispatch, setOperationRunning);
  }

  function onNext() {
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(approveUploadedFiles, approveReason);
    // don't include reason text if it's not changing, otherwise we'll update the reason comment
    const reasonNeedsUpdate = tokensRemoved !== originalReason && !(_.isEmpty(originalReason)
      && _.isEmpty(tokensRemoved));
    const updateInfo = {
      marketId,
      investibleId,
      groupId: marketId,
      newQuantity: approveQuantity,
      currentQuantity: wasDeleted ? 0 : originalQuantity,
      newReasonText: tokensRemoved,
      currentReasonId,
      reasonNeedsUpdate,
      uploadedFiles: filteredUploads,
      version: approveReasonVersion
    };
    return updateInvestment(updateInfo).then((result) => {
      doQuick(result);
      navigateToOption(history, parentMarketId, parentInvestibleId, parentGroupId, investibleId);
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

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
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
          Your vote was deleted.
        </Typography>
      )}
      <JobDescription marketId={marketId} investibleId={investibleId}/>
      <div className={classes.borderBottom}/>
      <AddInitialVote
        marketId={marketId}
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
        onNext={onNext}
        nextLabel="DecisionWizardApprove"
        showOtherNext
        otherNextValid
        otherNextLabel="ApprovalWizardBlock"
        otherSpinOnClick={false}
        onOtherNext={() => navigate(history,
          formInvestibleAddCommentLink(DECISION_COMMENT_WIZARD_TYPE, investibleId, undefined, ISSUE_TYPE))}
        otherNextShowEdit={hasDecisionComment(marketId, ISSUE_TYPE, investibleId)}
      />
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