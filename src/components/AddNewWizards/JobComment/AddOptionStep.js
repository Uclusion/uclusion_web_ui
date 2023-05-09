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
import { getInvestible, refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import {
  getInReviewStage,
  getRequiredInputStage,
  getStages
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { sendComment } from '../../../api/comments';
import { changeInvestibleStageOnCommentOpen } from '../../../utils/commentFunctions';
import { addCommentToMarket } from '../../../contexts/CommentsContext/commentsContextHelper';
import { quickNotificationChanges } from '../../Comments/CommentAdd';
import { QUESTION_TYPE } from '../../../constants/comments';
import { getMarketInfo } from '../../../utils/userFunctions';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { workListStyles } from '../../../pages/Home/YourWork/WorkListItem';
import { usePresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { formCommentLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';

function AddOptionStep(props) {
  const { formData, marketId, investibleId } = props;
  const { inlineMarketId, commentId, groupId } = formData;
  const editorName = `addOptionWizard${inlineMarketId}`;
  const [hasValue, setHasValue] = useState(!editorEmpty(getQuillStoredState(editorName)));
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [investibleState, investiblesDispatch] = useContext(InvestiblesContext);
  const classes = useContext(WizardStylesContext);
  const workItemClasses = workListStyles();
  const [marketStagesState] = useContext(MarketStagesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [commentState, commentDispatch] = useContext(CommentsContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const history = useHistory();
  const presences = usePresences(marketId);
  const marketStages = getStages(marketStagesState, inlineMarketId) || [];
  const investmentAllowedStage = marketStages.find((stage) => stage.allows_investment) || {};
  const requiresInputStage = getRequiredInputStage(marketStagesState, marketId) || {};
  const inv = getInvestible(investibleState, investibleId);
  const { investible } = inv;
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { stage: currentStageId } = marketInfo;
  const inReviewStage = getInReviewStage(marketStagesState, marketId) || {};
  const myPresence = presences.find((presence) => presence.current_user) || {};

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
        setHasValue(false);
      })
  }

  function myOnFinish() {
    return sendComment(marketId, commentId).then((response) => {
      let comment = response;
      changeInvestibleStageOnCommentOpen(false, true, undefined,
        requiresInputStage, [marketInfo], investible, investiblesDispatch, comment);
      addCommentToMarket(comment, commentState, commentDispatch);
      quickNotificationChanges(QUESTION_TYPE, inReviewStage, inReviewStage.id === currentStageId, investibleId,
        messagesState, workItemClasses, messagesDispatch, [], comment, undefined, commentState,
        commentDispatch, marketId, myPresence);
      setOperationRunning(false);
      navigate(history, formCommentLink(marketId, groupId, investibleId, commentId));
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
        terminateLabel="JobOptionTerminate"/>
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