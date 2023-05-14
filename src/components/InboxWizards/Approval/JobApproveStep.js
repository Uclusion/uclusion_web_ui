import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import AddInitialVote from '../../../pages/Investible/Voting/AddInitialVote';
import { processTextAndFilesForSave } from '../../../api/files';
import { updateInvestment } from '../../../api/marketInvestibles';
import { resetEditor } from '../../TextEditors/Utilities/CoreUtils';
import { addMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { partialUpdateInvestment } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import _ from 'lodash';
import { formInvestibleLink } from '../../../utils/marketIdPathFunctions';
import { getMyUserForMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { removeWorkListItem, workListStyles } from '../../../pages/Home/YourWork/WorkListItem';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import JobDescription from '../JobDescription';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { getMarketInfo } from '../../../utils/userFunctions';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';

export function getJobApproveEditorName(investibleId) {
  return `jobapproveeditor${investibleId}`;
}
function JobApproveStep(props) {
  const { marketId, updateFormData, formData, onFinish: parentOnFinish, message, investibleId,
    yourVote } = props;
  const [, commentsDispatch] = useContext(CommentsContext);
  const [, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [marketsState] = useContext(MarketsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [, messagesDispatch] = useContext(NotificationsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const workItemClasses = workListStyles();
  const userId = getMyUserForMarket(marketsState, marketId);
  const validForm = formData.approveQuantity != null;
  const classes = wizardStyles();
  const editorName = getJobApproveEditorName(investibleId);
  const wasDeleted = yourVote?.deleted;
  const inv = getInvestible(investiblesState, investibleId);
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { group_id: groupId } = marketInfo;

  function onNext(isGotoJob) {
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
      if (isGotoJob) {
        return { link: `${formInvestibleLink(marketId, investibleId)}#cv${userId}` };
      }
      return {};
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
    removeWorkListItem(message, workItemClasses.removed, messagesDispatch);
  }

  function onCompleteFinish(formData) {
    if (_.isEmpty(formData) || _.isEmpty(formData.link)) {
      setOperationRunning(false);
      resetEditor(editorName);
      removeWorkListItem(message, workItemClasses.removed, messagesDispatch);
    } else {
      parentOnFinish(formData);
    }
  }

  return (
    <WizardStepContainer
      {...props}
    >
      <div>
        <Typography className={classes.introText} variant="h6">
          How certain are you this job should be done?
        </Typography>
        {wasDeleted && (
          <Typography className={classes.introSubText} variant="subtitle1">
            Your approval was deleted or expired.
          </Typography>
        )}
        <JobDescription marketId={marketId} investibleId={investibleId} showDescription={false} />
        <AddInitialVote
          marketId={marketId}
          onChange={onQuantityChange}
          newQuantity={approveQuantity}
          onEditorChange={onApproveChange('approveReason')}
          onUpload={onApproveChange('approveUploadedFiles')}
          editorName={editorName}
        />
        <div className={classes.borderBottom}/>
        <WizardStepButtons
          {...props}
          finish={onCompleteFinish}
          onFinish={onFinish}
          validForm={validForm}
          showNext={validForm}
          showOtherNext={validForm}
          showTerminate={message.is_highlighted}
          onNext={() => onNext(false)}
          onOtherNext={() => onNext(true)}
          terminateLabel="defer"
          otherNextLabel="approveAndGotoJob"
          nextLabel="yourVotingVoteForThisPlanning"
        />
      </div>
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