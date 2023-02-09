import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { editorEmpty, getQuillStoredState, resetEditor } from '../../TextEditors/Utilities/CoreUtils';
import { useEditor } from '../../TextEditors/quillHooks';
import { convertDescription } from '../../../utils/stringFunctions';
import { addPlanningInvestible } from '../../../api/investibles';
import { processTextAndFilesForSave } from '../../../api/files';
import { refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { getStages } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { sendComment } from '../../../api/comments';
import { addCommentToMarket } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';

function AddOptionStep(props) {
  const { formData } = props;
  const { inlineMarketId, commentId, marketId } = formData;
  const editorName = `addOptionWizard${inlineMarketId}`;
  const [hasValue, setHasValue] = useState(!editorEmpty(getQuillStoredState(editorName)));
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const classes = useContext(WizardStylesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentState, commentDispatch] = useContext(CommentsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const marketStages = getStages(marketStagesState, inlineMarketId) || [];
  const investmentAllowedStage = marketStages.find((stage) => stage.allows_investment) || {};

  const editorSpec = {
    placeholder: "Your option...",
    value: getQuillStoredState(editorName),
    marketId: inlineMarketId,
    onUpload: setUploadedFiles,
    onChange: () => setHasValue(true),
  };

  const [Editor] = useEditor(editorName, editorSpec);

  function createOption() {
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(uploadedFiles, getQuillStoredState(editorName));
    const { name, description} = convertDescription(tokensRemoved);
    const addInfo = {
      name,
      description,
      groupId: inlineMarketId,
      marketId: inlineMarketId,
      uploadedFiles: filteredUploads,
      stageId: investmentAllowedStage.id
    }
    return addPlanningInvestible(addInfo)
      .then((inv) => {
        refreshInvestibles(investiblesDispatch, () => {}, [inv]);
        // reset the editor box
        resetEditor(editorName, '', {placeholder: 'Your option...'});
        setUploadedFiles([]);
      })
  }

  function myOnFinish(){
    return sendComment(marketId, commentId).then((response) => {
      addCommentToMarket(response, commentState, commentDispatch);
      setOperationRunning(false);
    });
  }

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
    <div>
      <Typography className={classes.introText}>
        What are the options?
      </Typography>
      {Editor}
      <div className={classes.borderBottom} />
      <WizardStepButtons
        {...props}
        validForm={hasValue}
        nextLabel="JobCommentConfigure"
        onNext={createOption}
        spinOnClick={true}
        otherSpinOnClick={true}
        showOtherNext
        onOtherNext={createOption}
        onOtherDoAdvance={false}
        otherNextLabel="JobCommentCreateAnotherOption"
        onTerminate={myOnFinish}
        showTerminate={true}
        terminateLabel="DecideWizardContinue"/>
    </div>
    </WizardStepContainer>
  );
}

AddOptionStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

AddOptionStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default AddOptionStep;