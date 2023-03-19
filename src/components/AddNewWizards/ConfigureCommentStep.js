import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { FormControl, FormControlLabel, Radio, RadioGroup, Typography } from '@material-ui/core';
import WizardStepContainer from './WizardStepContainer';
import { WizardStylesContext } from './WizardStylesContext';
import WizardStepButtons from './WizardStepButtons';
import { QUESTION_TYPE, SUGGEST_CHANGE_TYPE } from '../../constants/comments';
import { FormattedMessage } from 'react-intl';
import { getMentionsFromText, saveComment, sendComment, updateComment } from '../../api/comments';
import { allowVotingForSuggestion, changeInvestibleStageOnCommentOpen } from '../../utils/commentFunctions';
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
  const { updateFormData, formData, useType, comment, allowMulti } = props;
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
  const { useAnswer, marketId, commentId, investibleId, groupId } = formData;
  const presences = usePresences(marketId);
  const [commentAddStateFull, commentAddDispatch] = usePageStateReducer('addDecisionCommentWizard');
  const [commentAddState, , commentAddStateReset] =
    getPageReducerPage(commentAddStateFull, commentAddDispatch, investibleId || groupId);
  const {
    uploadedFiles,
    editorName
  } = commentAddState;

  function onFinish() {
    if (comment) {
      navigate(history, formCommentLink(comment.market_id, comment.group_id, comment.investible_id, comment.id));
    } else if (investibleId) {
      navigate(history, formInvestibleLink(marketId, investibleId));
    } else {
      navigate(history, formMarketLink(marketId, groupId));
    }
  }

  function quickAddComment(comment) {
    addCommentToMarket(comment, commentState, commentDispatch);
    if (comment.investible_id) {
      const requiresInputStage = getRequiredInputStage(marketStagesState, comment.market_id) || {};
      const inv = getInvestible(investibleState, comment.investible_id);
      const { investible } = inv;
      const marketInfo = getMarketInfo(inv, comment.market_id) || {};
      const inReviewStage = getInReviewStage(marketStagesState, comment.market_id) || {};
      const myPresence = presences.find((presence) => presence.current_user) || {};
      changeInvestibleStageOnCommentOpen(false, true, undefined,
        requiresInputStage, [marketInfo], investible, investiblesDispatch, comment);
      quickNotificationChanges(comment.comment_type, inReviewStage, inReviewStage.id === marketInfo.stage,
        comment.investible_id, messagesState, workItemClasses, messagesDispatch, [], comment,
        undefined, commentState, commentDispatch, comment.market_id, myPresence);
    }
    setOperationRunning(false);
    navigate(history, formCommentLink(comment.market_id, comment.group_id, comment.investible_id, comment.id));
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
      if (comment) {
        if (allowMulti === useAnswerBool) {
          // No op
          navigate(history, formCommentLink(comment.market_id, comment.group_id, comment.investible_id, comment.id));
        } else {
          updateComment(comment.market_id, comment.id, undefined, undefined, undefined,
            undefined, undefined, undefined, undefined, useAnswerBool)
            .then((response) => {
              const { comment } = response;
              addMarket(response, marketsDispatch, presenceDispatch);
              quickAddComment(comment);
            });
        }
      } else {
        if (useAnswerBool) {
          updateComment(marketId, commentId, undefined, undefined, undefined,
            undefined, undefined, true, undefined, true)
            .then((response) => {
              const { comment } = response;
              addMarket(response, marketsDispatch, presenceDispatch);
              quickAddComment(comment);
            });
        } else {
          sendComment(marketId, commentId).then((response) => {
            quickAddComment(response);
          });
        }
      }
    } else {
      if (comment) {
        allowVotingForSuggestion(comment.id, setOperationRunning, marketsDispatch, presenceDispatch,
          commentState, commentDispatch, investiblesDispatch, !useAnswerBool);
      } else {
        handleSaveSuggestion(!useAnswerBool);
      }
    }
  }
  const defaultAnswer = useType === QUESTION_TYPE ? (allowMulti ? 'Yes': 'No') : 'Yes';
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