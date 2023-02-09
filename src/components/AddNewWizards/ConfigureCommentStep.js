import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { FormControl, FormControlLabel, Radio, RadioGroup, Typography } from '@material-ui/core';
import WizardStepContainer from './WizardStepContainer';
import { WizardStylesContext } from './WizardStylesContext';
import WizardStepButtons from './WizardStepButtons';
import { QUESTION_TYPE, SUGGEST_CHANGE_TYPE } from '../../constants/comments';
import { FormattedMessage } from 'react-intl';
import { sendComment, updateComment } from '../../api/comments';
import { changeInvestibleStageOnCommentOpen } from '../../utils/commentFunctions';
import { addCommentToMarket } from '../../contexts/CommentsContext/commentsContextHelper';
import { quickNotificationChanges } from '../Comments/CommentAdd';
import { workListStyles } from '../../pages/Home/YourWork/WorkListItem';
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext';
import { usePresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import {
  getInReviewStage,
  getRequiredInputStage
} from '../../contexts/MarketStagesContext/marketStagesContextHelper';
import { getInvestible } from '../../contexts/InvestibesContext/investiblesContextHelper';
import { getMarketInfo } from '../../utils/userFunctions';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { addMarket } from '../../contexts/MarketsContext/marketsContextHelper';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';

function ConfigureCommentStep(props) {
  const { updateFormData, formData } = props;
  const classes = useContext(WizardStylesContext);
  const workItemClasses = workListStyles();
  const [marketStagesState] = useContext(MarketStagesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [commentState, commentDispatch] = useContext(CommentsContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [investibleState, investiblesDispatch] = useContext(InvestiblesContext);
  const [, presenceDispatch] = useContext(MarketPresencesContext);
  const [, marketsDispatch] = useContext(MarketsContext);
  const { useType, useAnswer, marketId, commentId, investibleId, currentStageId } = formData;
  const presences = usePresences(marketId);

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
  }

  function myOnFinish() {
    return sendComment(marketId, commentId).then((response) => {
      quickAddComment(response);
    });
  }

  function configureComment() {
    if (useType === QUESTION_TYPE) {
      if (useAnswer) {
        updateComment(marketId, commentId, undefined, undefined, undefined,
          undefined, undefined, true, undefined, true)
          .then((response) => {
            const { comment, market } = response;
            quickAddComment(comment);
            addMarket(market, marketsDispatch, presenceDispatch);
          });
      } else {
        myOnFinish();
      }
    } else {
      if (useAnswer) {
        myOnFinish();
      } else {
        updateComment(marketId, commentId, undefined, undefined, undefined,
          undefined, undefined, true, undefined, undefined,
          true).then((response) => {
            const { comment, market } = response;
            quickAddComment(comment);
            addMarket(market, marketsDispatch, presenceDispatch);
          });
      }
    }
  }

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
          value={useAnswer || ''}
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
                value={answer === 'Yes'}
              />
            );
          })}
        </RadioGroup>
      </FormControl>
      <div className={classes.borderBottom} />
      <WizardStepButtons
        {...props}
        validForm={useAnswer !== undefined && useAnswer !== ''}
        nextLabel="WizardContinue"
        onNext={configureComment}
        spinOnClick={true}
        showTerminate={true}
        finish={myOnFinish}
        terminateLabel="DecideWizardContinue"
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