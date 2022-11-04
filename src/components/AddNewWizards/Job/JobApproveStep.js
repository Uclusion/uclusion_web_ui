import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import WizardStepContainer from '../WizardStepContainer'
import { WizardStylesContext } from '../WizardStylesContext'
import WizardStepButtons from '../WizardStepButtons'
import { navigate } from '../../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import AddInitialVote from '../../../pages/Investible/Voting/AddInitialVote';
import { processTextAndFilesForSave } from '../../../api/files';
import { updateInvestment } from '../../../api/marketInvestibles';
import { resetEditor } from '../../TextEditors/Utilities/CoreUtils';

function JobAssignStep (props) {
  const { marketId, groupId, clearFormData, updateFormData, formData, onFinish } = props;
  const history = useHistory();
  const validForm = formData.approveQuantity != null;
  const classes = useContext(WizardStylesContext)
  const { investibleId } = formData;
  const editorName = `${investibleId}-newjobapproveeditor`;

  function onNext() {
    const {link, approveUploadedFiles, approveReason, approveQuantity} = formData;
    console.dir(formData);
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
      reasonNeedsUpdate: tokensRemoved !== null,
      uploadedFiles: filteredUploads
    };
    return updateInvestment(updateInfo).then(() => {
      clearFormData();
      navigate(history, link);
    })
  }

  function onTerminate() {
    const { link } = formData;
    clearFormData();
    resetEditor(editorName);
    navigate(history, link);
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
          validForm={validForm}
          showNext={validForm}
          showTerminate={!validForm}
          onNext={onNext}
          onTerminate={onTerminate}
          terminateLabel="JobWizardGotoJob"
          nextLabel="JobWizardGotoJob"
        />
      </div>
    </WizardStepContainer>
  )
}

JobAssignStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
}

JobAssignStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
}

export default JobAssignStep