import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import WizardStepButtons from '../WizardStepButtons';
import { editorEmpty, getQuillStoredState, resetEditor } from '../../TextEditors/Utilities/CoreUtils';
import { HASH_MENTION_CHARS, useEditor } from '../../TextEditors/quillHooks';
import { convertDescription } from '../../../utils/stringFunctions';
import { addDecisionInvestible } from '../../../api/investibles';
import { processTextAndFilesForSave } from '../../../api/files';
import { getInvestible, getMarketInvestibles, refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { getStages } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { usePresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { navigateToOption } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { WizardStylesContext } from '../WizardStylesContext';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import { getComment, getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import OptionVoting from '../../../pages/Dialog/Decision/OptionVoting';
import _ from 'lodash';
import { getMarketInfo } from '../../../utils/userFunctions';
import NamePreviewBar, { useNamePreview } from '../../TextFields/NamePreviewBar';

function OptionDescriptionStep (props) {
  const { marketId, parentGroupId, parentInvestibleId, parentMarketId, parentCommentId, createdBy, updateFormData = () => {},
    formData = {} } = props;
  const editorName = `addOptionWizard${marketId}`;
  const [hasValue, setHasValue] = useState(!editorEmpty(getQuillStoredState(editorName)));
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedOptionId, setSelectedOptionId] = useState(undefined);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentsState] = useContext(CommentsContext);
  const [investibleState] = useContext(InvestiblesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const history = useHistory();
  const presences = usePresences(marketId);
  const classes = useContext(WizardStylesContext);
  const myPresence = presences.find((presence) => presence.current_user) || {};
  const inv = getInvestible(investibleState, parentInvestibleId);
  const marketInfo = getMarketInfo(inv, parentMarketId) || {};
  const { assigned } = marketInfo || {};
  const isInvestibleAssigned = (assigned || []).includes(myPresence.id);
  const marketStages = getStages(marketStagesState, marketId) || [];
  const investmentAllowedStage = marketStages.find((stage) => stage.allows_investment) || {};
  const proposedStage = marketStages.find((stage) => !stage.allows_investment) || {};
  const isQuestionCreator = createdBy === myPresence.id;
  const isQuestionAdmin = isQuestionCreator || isInvestibleAssigned;
  const parentComment = getComment(commentsState, parentMarketId, parentCommentId);
  const allOptions = getMarketInvestibles(investibleState, marketId) || [];
  const allOptionsComments = getMarketComments(commentsState, marketId) || [];
  const { useCompression } = formData;
  const { name: namePreview, updateName, refreshName } = useNamePreview(editorName);

  const editorSpec = {
    placeholder: "Ex: make magic happen via A, B, C",
    value: getQuillStoredState(editorName),
    marketId,
    mentionsAllowed: true,
    mentionDenotationChars: HASH_MENTION_CHARS,
    onUpload: setUploadedFiles,
    autoFocus: true,
    onChange: () => { setHasValue(!editorEmpty(getQuillStoredState(editorName))); updateName(); },
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
      stageId: isQuestionAdmin ? investmentAllowedStage.id : proposedStage.id
    }
    return addDecisionInvestible(addInfo)
      .then((inv) => {
        refreshInvestibles(investiblesDispatch, () => {}, [inv]);
        // reset the editor box
        resetEditor(editorName, '', {placeholder: 'Your option...'});
        setUploadedFiles([]);
        setHasValue(false)
        refreshName();
        setOperationRunning(false);
        navigateToOption(history, parentMarketId, parentInvestibleId, parentGroupId, inv.investible.id);
      });
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
          {/* T-all-2194: existing options open read-only on click, like any other option list */}
          <OptionVoting marketPresences={presences} investibles={allOptions} marketId={marketId}
                        comments={allOptionsComments} inArchives={false} isSent isInbox removeActions
                        selectedInvestibleId={selectedOptionId} setSelectedInvestibleId={setSelectedOptionId} />
        </div>
      )}
      {_.isEmpty(allOptions) && (
        <div style={{ marginTop: '2rem' }} />
      )}
      <NamePreviewBar name={namePreview} />
      {Editor}
      <div className={classes.borderBottom}/>
      <WizardStepButtons
        {...props}
        validForm={hasValue}
        nextLabel={isQuestionAdmin ? 'inlineAddLabel' : 'inlineProposeLabel'}
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

export default OptionDescriptionStep;