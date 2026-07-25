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
import { getMarketInvestibles, refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { getStages } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { sendComment } from '../../../api/comments';
import { addCommentToMarket, getComment, getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { formCommentLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import OptionVoting from '../../../pages/Dialog/Decision/OptionVoting';
import { usePresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { DECISION_TYPE } from '../../../constants/markets';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import NamePreviewBar, { useNamePreview } from '../../TextFields/NamePreviewBar';

function AddOptionStep(props) {
  const { formData = {} } = props;
  const { inlineMarketId, commentId, marketId, groupId } = formData;
  const editorName = `addOptionWizard${inlineMarketId}`;
  const [hasValue, setHasValue] = useState(!editorEmpty(getQuillStoredState(editorName)));
  const [useCompression, setUseCompression] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedOptionId, setSelectedOptionId] = useState(undefined);
  const history = useHistory();
  const [investibleState, investiblesDispatch] = useContext(InvestiblesContext);
  const classes = useContext(WizardStylesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentState, commentDispatch] = useContext(CommentsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const inlinePresences = usePresences(inlineMarketId);
  const allOptions = getMarketInvestibles(investibleState, inlineMarketId) || [];
  const allOptionsComments = getMarketComments(commentState, inlineMarketId) || [];
  const marketStages = getStages(marketStagesState, inlineMarketId) || [];
  const investmentAllowedStage = marketStages.find((stage) => stage.allows_investment) || {};
  const parentComment = getComment(commentState, marketId, commentId);
  const { name: namePreview, updateName, refreshName } = useNamePreview(editorName);

  const editorSpec = {
    placeholder: "Your option...",
    value: getQuillStoredState(editorName),
    marketId: inlineMarketId,
    mentionsAllowed: true,
    mentionDenotationChars: ['#'],
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
        refreshName();
      })
  }

  function myOnFinish(){
    return sendComment(marketId, commentId, DECISION_TYPE).then((response) => {
      addCommentToMarket(response, commentState, commentDispatch);
      setOperationRunning(false);
      navigate(history, formCommentLink(marketId, groupId, undefined, commentId));
    });
  }

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
      <Typography className={classes.introText}>
        What are the options?
      </Typography>
      <CommentBox
        comments={[parentComment]}
        marketId={marketId}
        allowedTypes={[]}
        removeActions
        showVoting={false}
        isInbox
        compressAll
        inboxMessageId={parentComment?.id}
        toggleCompression={() => setUseCompression(!useCompression)}
        useCompression={useCompression}
      />
      <div style={{marginBottom: '2rem'}}>
        {/* T-all-2194: options created so far open read-only on click, like any other option list */}
        <OptionVoting marketPresences={inlinePresences} investibles={allOptions} marketId={inlineMarketId}
                      comments={allOptionsComments} inArchives={false} isSent={false} isInbox removeActions
                      selectedInvestibleId={selectedOptionId} setSelectedInvestibleId={setSelectedOptionId} />
      </div>
      <NamePreviewBar name={namePreview} />
      {Editor}
      <div className={classes.borderBottom} />
      <WizardStepButtons
        {...props}
        validForm={hasValue}
        nextLabel="JobCommentConfigure"
        isFinal={false}
        onNext={createOption}
        spinOnClick={true}
        otherSpinOnClick={true}
        showOtherNext
        onOtherNext={createOption}
        onOtherDoAdvance={false}
        otherNextLabel="JobCommentCreateAnotherOption"
        onTerminate={myOnFinish}
        showTerminate={true}
        terminateLabel="JobOptionTerminate"
        hideInlineCancel/>
    </WizardStepContainer>
  );
}

AddOptionStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

export default AddOptionStep;