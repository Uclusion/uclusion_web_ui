import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import WizardStepContainer from '../WizardStepContainer'
import { WizardStylesContext } from '../WizardStylesContext'
import WizardStepButtons from '../WizardStepButtons'
import AddInitialVote from '../../../pages/Investible/Voting/AddInitialVote';
import { processTextAndFilesForSave } from '../../../api/files';
import { updateInvestment } from '../../../api/marketInvestibles';
import { resetEditor } from '../../TextEditors/Utilities/CoreUtils';
import { getMarketComments, refreshMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper'
import { partialUpdateInvestment } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import _ from 'lodash'
import { formInvestibleLink } from '../../../utils/marketIdPathFunctions'

function JobApproveStep(props) {
  const { marketId, groupId, clearFormData, updateFormData, formData, onFinish: parentOnFinish } = props;
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const validForm = formData.approveQuantity != null;
  const classes = useContext(WizardStylesContext)
  const { investibleId } = formData;
  const editorName = `${investibleId}-jobapproveeditor`;

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
      currentQuantity: 0,
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
      return { link: formInvestibleLink(marketId, investibleId) };
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
      approveQuantity: value
    });
  }

  const {approveQuantity} = formData;

  function onFinish() {
    resetEditor(editorName);
    parentOnFinish();
  }

  return (
    <WizardStepContainer
      {...props}
    >
      <div>
        <Typography className={classes.introText} variant="h6">
          How certain are you this job should be done?
        </Typography>

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
          finish={onFinish}
          onFinish={onFinish}
          validForm={validForm}
          showNext={validForm}
          showTerminate={!validForm}
          onNext={onNext}
          terminateLabel="JobWizardGotoJob"
          nextLabel="JobWizardGotoJob"
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