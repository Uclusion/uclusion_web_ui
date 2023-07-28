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
import {
  addMarketComments,
  getMarketComments
} from '../../../contexts/CommentsContext/commentsContextHelper';
import {
  getMarketPresences, getReasonForVote,
  partialUpdateInvestment
} from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import _ from 'lodash'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';

function JobApproveStep(props) {
  const { marketId, investibleId, marketInfo, updateFormData, formData } = props;
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [marketPresencesState, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const history = useHistory();
  const classes = useContext(WizardStylesContext);
  const { group_id: groupId } = marketInfo;
  const comments = getMarketComments(commentsState, marketId, groupId);
  const editorName = `newjobapproveeditor${investibleId}`;
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const yourPresence = marketPresences.find((presence) => presence.current_user);
  const yourVote = yourPresence?.investments?.find((investment) => investment.investible_id === investibleId);
  const { quantity } = yourVote || {};
  const yourReason = getReasonForVote(yourVote, comments);
  const validForm = (formData.approveQuantity != null) || (formData.approvalWasSet !== true && quantity !== undefined);
  function onTerminate() {
    resetEditor(editorName);
    navigate(history, formInvestibleLink(marketId, investibleId));
  }

  function onNext() {
    const { approveUploadedFiles, approveReason: approveReasonSet, approveQuantity: approveQuantitySet,
      approvalWasSet } = formData;
    const approveQuantity = approvalWasSet ? approveQuantitySet : quantity;
    const approveReason = approvalWasSet ? approveReasonSet : yourReason.body;
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(approveUploadedFiles, approveReason);

    const updateInfo = {
      marketId,
      investibleId,
      groupId,
      newQuantity: parseInt(approveQuantity),
      currentQuantity: 0,
      currentReasonId: yourReason?.id,
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
      onTerminate();
    })
  }

  function onApproveChange (key) {
    return (data) => {
      const update = {
        [key]: data,
        approvalWasSet: true
      };
      updateFormData(update);
    };
  }


  function onQuantityChange(event) {
    const {value} = event.target;
    updateFormData({
      approveQuantity: parseInt(value, 10),
      approvalWasSet: true
    });
  }

  const { approveQuantity } = formData;

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
        <Typography className={classes.introText} variant="h6">
          How certain are you this job should be done?
        </Typography>
        {quantity && (
          <Typography className={classes.introSubText} variant="subtitle1">
            Changing the assignment removed your previous approval.
          </Typography>
        )}
        <AddInitialVote
          marketId={marketId}
          onChange={onQuantityChange}
          newQuantity={approveQuantity || quantity}
          defaultReason={yourReason.body}
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
          nextLabel="yourVotingVoteForThisPlanning"
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