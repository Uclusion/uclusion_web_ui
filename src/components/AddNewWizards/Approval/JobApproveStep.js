import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import WizardStepContainer from '../WizardStepContainer'
import { WizardStylesContext } from '../WizardStylesContext'
import WizardStepButtons from '../WizardStepButtons'
import { formInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router'
import AddInitialVote from '../../../pages/Investible/Voting/AddInitialVote';
import { processTextAndFilesForSave } from '../../../api/files';
import { updateInvestment } from '../../../api/marketInvestibles';
import { resetEditor } from '../../TextEditors/Utilities/CoreUtils';
import { getMarketComments, refreshMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper'
import {
  partialUpdateInvestment
} from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import _ from 'lodash'
import { getJobApproveEditorName } from '../../InboxWizards/Approval/JobApproveStep';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';

function JobApproveStep(props) {
  const { marketId, groupId, clearFormData, updateFormData, formData, investibleId } = props;
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const history = useHistory();
  const classes = useContext(WizardStylesContext);
  const editorName = getJobApproveEditorName(investibleId);
  const {approveUploadedFiles, approveReason, approveQuantity, originalQuantity, wasDeleted, userId} = formData;
  const validForm = approveQuantity >= 0;
  console.debug(`quantity is ${approveQuantity} and valid is ${validForm}`)

  function onNext() {
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(approveUploadedFiles, approveReason);

    const updateInfo = {
      marketId,
      investibleId,
      groupId,
      newQuantity: approveQuantity,
      currentQuantity: originalQuantity,
      newReasonText: tokensRemoved,
      reasonNeedsUpdate: !_.isEmpty(tokensRemoved),
      uploadedFiles: filteredUploads
    };
    return updateInvestment(updateInfo).then((result) => {
      const { commentResult, investmentResult } = result;
      const { commentAction, comment } = commentResult;
      if (commentAction !== "NOOP") {
        const comments = getMarketComments(commentsState, marketId);
        refreshMarketComments(commentsDispatch, marketId, [comment, ...comments]);
      }
      partialUpdateInvestment(marketPresencesDispatch, investmentResult, true);
      clearFormData();
      setOperationRunning(false);
      navigate(history, `${formInvestibleLink(marketId, investibleId)}#cv${userId}`);
    })
  }

  function onTerminate() {
    clearFormData();
    resetEditor(editorName);
    navigate(history, formInvestibleLink(marketId, investibleId));
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
          How certain are you this job should be done?
        </Typography>
        {wasDeleted && (
          <Typography className={classes.introSubText} variant="subtitle1">
            Your approval was deleted or expired.
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
          editorName={editorName}
        />
        <div className={classes.borderBottom}/>
        <WizardStepButtons
          {...props}
          validForm={validForm}
          showTerminate={true}
          onNext={onNext}
          onTerminate={onTerminate}
          terminateLabel="JobWizardGotoJob"
          nextLabel="JobWizardApproveJob"
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