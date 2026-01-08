import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { editorEmpty, getQuillStoredState, resetEditor } from '../../TextEditors/Utilities/CoreUtils';
import { useEditor } from '../../TextEditors/quillHooks';
import { convertDescription, stripHTML } from '../../../utils/stringFunctions';
import { addPlanningInvestible } from '../../../api/investibles';
import { processTextAndFilesForSave } from '../../../api/files';
import {
  getInvestible,
  getMarketInvestibles,
  refreshInvestibles
} from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { getRequiredInputStage, getStages } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { sendComment } from '../../../api/comments';
import { changeInvestibleStageOnCommentOpen } from '../../../utils/commentFunctions';
import { addCommentToMarket, getComment } from '../../../contexts/CommentsContext/commentsContextHelper';
import { quickNotificationChanges } from '../../Comments/CommentAdd';
import { QUESTION_TYPE } from '../../../constants/comments';
import { getMarketInfo } from '../../../utils/userFunctions';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { usePresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { formCommentLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import OptionListItem from '../../Comments/OptionListItem';
import { DECISION_TYPE } from '../../../constants/markets';
import CommentBox from '../../../containers/CommentBox/CommentBox';

function AddOptionStep(props) {
  const { formData = {}, marketId, investibleId } = props;
  const { inlineMarketId, commentId, groupId } = formData;
  const editorName = `addOptionWizard${inlineMarketId}`;
  const [hasValue, setHasValue] = useState(!editorEmpty(getQuillStoredState(editorName)));
  const [useCompression, setUseCompression] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [investibleState, investiblesDispatch] = useContext(InvestiblesContext);
  const classes = useContext(WizardStylesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [commentState, commentDispatch] = useContext(CommentsContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const history = useHistory();
  const presences = usePresences(marketId);
  const allOptions = getMarketInvestibles(investibleState, inlineMarketId) || [];
  const marketStages = getStages(marketStagesState, inlineMarketId) || [];
  const investmentAllowedStage = marketStages.find((stage) => stage.allows_investment) || {};
  const inv = getInvestible(investibleState, investibleId);
  const { investible } = inv;
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { assigned, stage: currentStageId } = marketInfo || {};
  const myPresence = presences.find((presence) => presence.current_user) || {};
  const creatorIsAssigned = (assigned || []).includes(myPresence.id);
  const requiresInputStage = getRequiredInputStage(marketStagesState, marketId) || {};
  const parentComment = getComment(commentState, marketId, commentId);

  const editorSpec = {
    placeholder: "Your option...",
    value: getQuillStoredState(editorName),
    marketId: inlineMarketId,
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
        setHasValue(false);
      })
  }

  function getOptionListItem(inv) {
    const investibleId = inv.investible.id;
    const description = stripHTML(inv.investible.description);
    return (
      <OptionListItem id={investibleId} description={description} title={inv.investible.name} removeActions />
    )
  }

  function myOnFinish() {
    return sendComment(marketId, commentId, undefined, DECISION_TYPE).then((response) => {
      let comment = response;
      changeInvestibleStageOnCommentOpen(false,
        creatorIsAssigned && currentStageId !== requiresInputStage.id, marketStagesState,
        [marketInfo], investible, investiblesDispatch, comment, myPresence);
      addCommentToMarket(comment, commentState, commentDispatch);
      quickNotificationChanges(QUESTION_TYPE, investibleId, messagesState, messagesDispatch, [], comment,
        undefined, commentState, commentDispatch, marketId, myPresence);
      setOperationRunning(false);
      navigate(history, formCommentLink(marketId, groupId, investibleId, commentId));
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
        {allOptions.map((fullInvestible) => getOptionListItem(fullInvestible))}
      </div>
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
        terminateLabel="JobOptionTerminate"/>
    </WizardStepContainer>
  );
}

AddOptionStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

export default AddOptionStep;