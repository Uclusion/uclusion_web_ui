import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { FormControl, FormControlLabel, Radio, RadioGroup, Typography } from '@material-ui/core';
import WizardStepContainer from './WizardStepContainer';
import { WizardStylesContext } from './WizardStylesContext';
import WizardStepButtons from './WizardStepButtons';
import { QUESTION_TYPE, SUGGEST_CHANGE_TYPE } from '../../constants/comments';
import { FormattedMessage } from 'react-intl';
import { getMentionsFromText, saveComment, sendComment, updateComment } from '../../api/comments';
import { changeInvestibleStageOnCommentOpen } from '../../utils/commentFunctions';
import { addCommentToMarket } from '../../contexts/CommentsContext/commentsContextHelper';
import { quickNotificationChanges } from '../Comments/CommentAdd';
import { workListStyles } from '../../pages/Home/YourWork/WorkListItem';
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext';
import { usePresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import { getInReviewStage, getRequiredInputStage } from '../../contexts/MarketStagesContext/marketStagesContextHelper';
import { addInvestible, getInvestible } from '../../contexts/InvestibesContext/investiblesContextHelper';
import { getMarketInfo } from '../../utils/userFunctions';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { addMarket } from '../../contexts/MarketsContext/marketsContextHelper';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { formCommentLink, formInvestibleLink, formMarketLink, navigate } from '../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { getQuillStoredState } from '../TextEditors/Utilities/CoreUtils';
import { processTextAndFilesForSave } from '../../api/files';
import { INITIATIVE_TYPE } from '../../constants/markets';
import TokenStorageManager, { TOKEN_TYPE_MARKET } from '../../authorization/TokenStorageManager';
import { getPageReducerPage, usePageStateReducer } from '../PageState/pageStateHooks';

function ConfigureCommentStep(props) {
  const { updateFormData, formData, useType } = props;
  const classes = useContext(WizardStylesContext);
  const workItemClasses = workListStyles();
  const history = useHistory();
  const [marketStagesState] = useContext(MarketStagesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [commentState, commentDispatch] = useContext(CommentsContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [investibleState, investiblesDispatch] = useContext(InvestiblesContext);
  const [, presenceDispatch] = useContext(MarketPresencesContext);
  const [, marketsDispatch] = useContext(MarketsContext);
  const { useAnswer, marketId, commentId, investibleId, groupId, currentStageId } = formData;
  const presences = usePresences(marketId);
  const [commentAddStateFull, commentAddDispatch] = usePageStateReducer('addDecisionCommentWizard');
  const [commentAddState, , commentAddStateReset] =
    getPageReducerPage(commentAddStateFull, commentAddDispatch, investibleId || groupId);
  const {
    uploadedFiles,
    editorName
  } = commentAddState;

  function onFinish() {
    if (investibleId) {
      navigate(history, formInvestibleLink(marketId, investibleId));
    } else {
      navigate(history, formMarketLink(marketId, groupId));
    }
  }

  function quickAddComment(comment) {
    addCommentToMarket(comment, commentState, commentDispatch);
    if (investibleId) {
      const requiresInputStage = getRequiredInputStage(marketStagesState, marketId) || {};
      const inv = getInvestible(investibleState, investibleId);
      const { investible } = inv;
      const marketInfo = getMarketInfo(inv, marketId) || {};
      const inReviewStage = getInReviewStage(marketStagesState, marketId) || {};
      const myPresence = presences.find((presence) => presence.current_user) || {};
      changeInvestibleStageOnCommentOpen(false, true, undefined,
        requiresInputStage, [marketInfo], investible, investiblesDispatch, comment);
      quickNotificationChanges(useType, inReviewStage, inReviewStage.id === currentStageId,
        investibleId, messagesState, workItemClasses, messagesDispatch, [], comment, undefined,
        commentState, commentDispatch, marketId, myPresence);
    }
    setOperationRunning(false);
    navigate(history, formCommentLink(marketId, comment.group_id, investibleId, commentId));
  }

  function myOnFinish() {
    return sendComment(marketId, commentId).then((response) => {
      quickAddComment(response);
    });
  }

  function handleSaveSuggestion(isRestricted) {
    const currentUploadedFiles = uploadedFiles || [];
    const myBodyNow = getQuillStoredState(editorName);
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(currentUploadedFiles, myBodyNow)
    const mentions = getMentionsFromText(tokensRemoved)
    return saveComment(marketId, groupId, investibleId, undefined, tokensRemoved, useType, filteredUploads, 
      mentions, undefined, INITIATIVE_TYPE, isRestricted, true)
      .then((response) => {
        commentAddStateReset();
        addMarket(response, marketsDispatch, presenceDispatch);
        const { market: { id: inlineMarketId }, token, investible } = response;
        if (investible) {
          addInvestible(investiblesDispatch, () => {}, investible);
        }
        const tokenStorageManager = new TokenStorageManager();
        return tokenStorageManager.storeToken(TOKEN_TYPE_MARKET, inlineMarketId, token).then(() => {
          quickAddComment(response.parent);
        });
      });
  }

  function configureComment() {
    const useAnswerBool = (useAnswer || defaultAnswer) === 'Yes';
    if (useType === QUESTION_TYPE) {
      if (useAnswerBool) {
        updateComment(marketId, commentId, undefined, undefined, undefined,
          undefined, undefined, true, undefined, true)
          .then((response) => {
            const { comment } = response;
            addMarket(response, marketsDispatch, presenceDispatch);
            quickAddComment(comment);
          });
      } else {
        myOnFinish();
      }
    } else {
      handleSaveSuggestion(!useAnswerBool);
    }
  }
  const defaultAnswer = useType === QUESTION_TYPE ? 'No' : 'Yes';
  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      {useType === QUESTION_TYPE && (
        <Typography className={classes.introText}>
          Can a user approve more than one option?
        </Typography>
      )}
      {useType === SUGGEST_CHANGE_TYPE && (
        <Typography className={classes.introText}>
          Will users besides you be able to see the voting?
        </Typography>
      )}
      <FormControl component="fieldset">
        <RadioGroup
          aria-labelledby="comment-type-choice"
          onChange={(event) => {
            const { value } = event.target;
            updateFormData({ useAnswer: value });
          }}
          value={useAnswer || defaultAnswer}
        >
          {['Yes', 'No'].map((answer) => {
            const answerId = `${useType}${answer}`;
            return (
              <FormControlLabel
                id={answerId}
                key={answer}
                /* prevent clicking the label stealing focus */
                onMouseDown={e => e.preventDefault()}
                control={<Radio color="primary" />}
                label={<FormattedMessage id={`${answerId}Config`} />}
                labelPlacement="end"
                value={answer}
              />
            );
          })}
        </RadioGroup>
      </FormControl>
      <div className={classes.borderBottom} />
      <WizardStepButtons
        {...props}
        nextLabel="OnboardingWizardFinish"
        onNext={configureComment}
        spinOnClick={true}
        showTerminate={true}
        onFinish={onFinish}
        terminateLabel="OnboardingWizardGoBack"
      />
    </div>
    </WizardStepContainer>
  );
}

ConfigureCommentStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

ConfigureCommentStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default ConfigureCommentStep;