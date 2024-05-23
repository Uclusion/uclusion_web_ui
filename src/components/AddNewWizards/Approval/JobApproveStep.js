import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { formInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import AddInitialVote from '../../../pages/Investible/Voting/AddInitialVote';
import { processTextAndFilesForSave } from '../../../api/files';
import { updateInvestment } from '../../../api/marketInvestibles';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import _ from 'lodash';
import { getJobApproveEditorName } from '../../InboxWizards/Approval/JobApproveStep';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { commonQuick } from './ApprovalWizard';
import JobDescription from '../../InboxWizards/JobDescription';
import { getAcceptedStage, getFullStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { stageChangeInvestible } from '../../../api/investibles';
import { onInvestibleStageChange } from '../../../utils/investibleFunctions';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { getMarketInfo } from '../../../utils/userFunctions';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';

function JobApproveStep(props) {
  const { marketId, groupId, updateFormData, formData, investibleId, currentReasonId } = props;
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [investiblesState, investiblesDispatch] = useContext(InvestiblesContext);
  const history = useHistory();
  const classes = useContext(WizardStylesContext);
  const inv = getInvestible(investiblesState, investibleId);
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { required_approvers: requiredApprovers, assigned, stage } = marketInfo;
  const editorName = getJobApproveEditorName(investibleId);
  const {approveUploadedFiles, approveReason, approveQuantity, originalQuantity, wasDeleted, userId,
    originalReason} = formData;
  const validForm = approveQuantity > 0;
  const isAssignedToMe = assigned?.includes(userId);

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
      groupId,
      newQuantity: approveQuantity,
      currentQuantity: wasDeleted ? 0 : originalQuantity,
      newReasonText: tokensRemoved,
      currentReasonId,
      reasonNeedsUpdate,
      uploadedFiles: filteredUploads
    };
    console.debug(`current reason id is ${currentReasonId}`)
    return updateInvestment(updateInfo).then((result) => {
      doQuick(result);
      navigate(history, `${formInvestibleLink(marketId, investibleId)}#cv${userId}`);
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

  function start() {
    const fullMoveStage = getAcceptedStage(marketStagesState, marketId);
    const fullCurrentStage = getFullStage(marketStagesState, marketId, stage) || {};
    const moveInfo = {
      marketId,
      investibleId,
      stageInfo: {
        current_stage_id: stage,
        stage_id: fullMoveStage.id,
      },
    };
    return stageChangeInvestible(moveInfo)
      .then((newInv) => {
        onInvestibleStageChange(fullMoveStage.id, newInv, investibleId, marketId, commentsState,
          commentsDispatch, investiblesDispatch, () => {}, marketStagesState, undefined,
          fullCurrentStage, marketPresencesDispatch);
        setOperationRunning(false);
        navigate(history, formInvestibleLink(marketId, investibleId));
      });
  }

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
      <Typography className={classes.introText} variant="h6">
        How certain are you this job should be done?
      </Typography>
      {wasDeleted && (
        <Typography className={classes.introSubText} variant="subtitle1">
          Your approval was deleted or expired.
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
        nextLabel="JobWizardApproveJob"
        showOtherNext={_.isEmpty(requiredApprovers) && isAssignedToMe}
        otherNextValid
        onOtherNext={start}
        otherNextLabel="skipAllApprovals"
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