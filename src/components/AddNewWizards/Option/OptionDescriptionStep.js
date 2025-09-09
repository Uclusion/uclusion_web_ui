import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import WizardStepButtons from '../WizardStepButtons';
import { editorEmpty, getQuillStoredState, resetEditor } from '../../TextEditors/Utilities/CoreUtils';
import { useEditor } from '../../TextEditors/quillHooks';
import { convertDescription, stripHTML } from '../../../utils/stringFunctions';
import { addDecisionInvestible } from '../../../api/investibles';
import { processTextAndFilesForSave } from '../../../api/files';
import { getMarketInvestibles, refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { getStages } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { usePresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { navigateToOption } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { WizardStylesContext } from '../WizardStylesContext';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import { getComment } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import OptionListItem from '../../Comments/OptionListItem';
import _ from 'lodash';

function OptionDescriptionStep (props) {
  const { marketId, parentGroupId, parentInvestibleId, parentMarketId, parentCommentId, createdBy, updateFormData,
    formData } = props;
  const editorName = `addOptionWizard${marketId}`;
  const [hasValue, setHasValue] = useState(!editorEmpty(getQuillStoredState(editorName)));
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentsState] = useContext(CommentsContext);
  const [investibleState] = useContext(InvestiblesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const history = useHistory();
  const presences = usePresences(marketId);
  const classes = useContext(WizardStylesContext);
  const myPresence = presences.find((presence) => presence.current_user) || {};
  const marketStages = getStages(marketStagesState, marketId) || [];
  const investmentAllowedStage = marketStages.find((stage) => stage.allows_investment) || {};
  const proposedStage = marketStages.find((stage) => !stage.allows_investment) || {};
  const isQuestionCreator = createdBy === myPresence.id;
  const parentComment = getComment(commentsState, parentMarketId, parentCommentId);
  const allOptions = getMarketInvestibles(investibleState, marketId) || [];
  const { useCompression } = formData;

  const editorSpec = {
    placeholder: "Ex: make magic happen via A, B, C",
    value: getQuillStoredState(editorName),
    marketId,
    onUpload: setUploadedFiles,
    autoFocus: true,
    onChange: () => setHasValue(!editorEmpty(getQuillStoredState(editorName))),
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
      groupId: marketId,
      marketId,
      uploadedFiles: filteredUploads,
      stageId: isQuestionCreator ? investmentAllowedStage.id : proposedStage.id
    }
    return addDecisionInvestible(addInfo)
      .then((inv) => {
        refreshInvestibles(investiblesDispatch, () => {}, [inv]);
        // reset the editor box
        resetEditor(editorName, '', {placeholder: 'Your option...'});
        setUploadedFiles([]);
        setHasValue(false)
        setOperationRunning(false);
        navigateToOption(history, parentMarketId, parentInvestibleId, parentGroupId, inv.investible.id);
      });
  }

  function getOptionListItem(inv) {
    const investibleId = inv.investible.id;
    const description = stripHTML(inv.investible.description);
    return (
      <OptionListItem id={investibleId} description={description} title={inv.investible.name} removeActions />
    )
  }

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
      <Typography className={classes.introText}>
        What is the new option?
      </Typography>
      <CommentBox
        comments={[parentComment]}
        marketId={parentMarketId}
        allowedTypes={[]}
        removeActions={true}
        showVoting={false}
        isInbox
        compressAll
        inboxMessageId={parentComment?.id}
        toggleCompression={() => updateFormData({useCompression: !useCompression})}
        useCompression={useCompression}
      />
      {!_.isEmpty(allOptions) && (
        <div style={{ marginBottom: '2rem', marginTop: '1rem' }}>
          Existing options
          {allOptions.map((fullInvestible) => getOptionListItem(fullInvestible))}
        </div>
      )}
      {Editor}
      <div className={classes.borderBottom}/>
      <WizardStepButtons
        {...props}
        validForm={hasValue}
        nextLabel={isQuestionCreator ? 'inlineAddLabel' : 'inlineProposeLabel'}
        onNext={createOption}
        showOtherNext
        onOtherNext={createOption}
        onOtherDoAdvance={false}
        isOtherFinal={false}
        otherNextLabel="JobCommentCreateAnotherOption"
      />
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