import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import WizardStepButtons from '../WizardStepButtons';
import { editorEmpty, getQuillStoredState, resetEditor } from '../../TextEditors/Utilities/CoreUtils';
import { useEditor } from '../../TextEditors/quillHooks';
import { convertDescription } from '../../../utils/stringFunctions';
import { addDecisionInvestible } from '../../../api/investibles';
import { processTextAndFilesForSave } from '../../../api/files';
import { refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { getStages } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { usePresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import {
  formCommentLink,
  navigate,
  navigateToOption
} from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { WizardStylesContext } from '../WizardStylesContext';

function OptionDescriptionStep (props) {
  const { marketId, parentGroupId, parentInvestibleId, parentMarketId, parentCommentId, createdBy } = props;
  const editorName = `addOptionWizard${marketId}`;
  const [hasValue, setHasValue] = useState(!editorEmpty(getQuillStoredState(editorName)));
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const history = useHistory();
  const presences = usePresences(marketId);
  const classes = useContext(WizardStylesContext);
  const myPresence = presences.find((presence) => presence.current_user) || {};
  const marketStages = getStages(marketStagesState, marketId) || [];
  const investmentAllowedStage = marketStages.find((stage) => stage.allows_investment) || {};
  const proposedStage = marketStages.find((stage) => !stage.allows_investment) || {};
  const isQuestionCreator = createdBy === myPresence.id;

  const editorSpec = {
    placeholder: "Ex: make magic happen via A, B, C",
    value: getQuillStoredState(editorName),
    marketId,
    onUpload: setUploadedFiles,
    onChange: () => setHasValue(true),
  };

  const [Editor] = useEditor(editorName, editorSpec);

  function createOption(createAnother) {
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(uploadedFiles, getQuillStoredState(editorName));
    const { name, description} = convertDescription(tokensRemoved);
    const addInfo = {
      name,
      description,
      groupId: marketId,
      marketId,
      uploadedFiles: filteredUploads,
      stageId: isQuestionCreator ? investmentAllowedStage.id : proposedStage
    }
    return addDecisionInvestible(addInfo)
      .then((inv) => {
        refreshInvestibles(investiblesDispatch, () => {}, [inv]);
        // reset the editor box
        resetEditor(editorName, '', {placeholder: 'Your option...'});
        setUploadedFiles([]);
        setOperationRunning(false);
        if (!createAnother) {
          navigateToOption(history, parentMarketId, parentInvestibleId, parentGroupId, inv.investible.id);
        }
      });
  }

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
    <div>
      <Typography className={classes.introText}>
        What is the new option?
      </Typography>
      {Editor}
      <div className={classes.borderBottom} />
      <WizardStepButtons
        {...props}
        validForm={hasValue}
        nextLabel="inlineAddLabel"
        onNext={createOption}
        showOtherNext
        onOtherNext={createOption}
        onOtherDoAdvance={false}
        otherNextLabel="JobCommentCreateAnotherOption"
        onTerminate={() => navigate(history, formCommentLink(parentMarketId, parentGroupId, parentInvestibleId,
          parentCommentId))}
        showTerminate={true}
        terminateLabel="JobOptionTerminate"/>
    </div>
    </WizardStepContainer>
  );
}

OptionDescriptionStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

OptionDescriptionStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default OptionDescriptionStep;