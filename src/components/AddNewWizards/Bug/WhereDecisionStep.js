import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { FormControl, FormControlLabel, Radio, RadioGroup, Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import { formCommentLink, formMarketAddInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { FormattedMessage } from 'react-intl';
import { REPLY_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE } from '../../../constants/comments';
import { updateComment } from '../../../api/comments';
import {
  changeInvestibleStageOnCommentOpen,
  handleAcceptSuggestion,
  isSingleAssisted
} from '../../../utils/commentFunctions';
import _ from 'lodash';
import { addCommentToMarket } from '../../../contexts/CommentsContext/commentsContextHelper';
import { quickNotificationChanges } from '../../Comments/CommentAdd';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { usePresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { getMarketInfo } from '../../../utils/userFunctions';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { getFullStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';

function WhereDecisionStep (props) {
  const { marketId, comment, comments, updateFormData, formData, previousStep } = props;
  const history = useHistory();
  const classes = useContext(WizardStylesContext);
  const presences = usePresences(marketId);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [investiblesState, investiblesDispatch] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const { useCompression, useType, destination } = formData;
  const allowedTypes = ['Other'];
  if (comment.comment_type === SUGGEST_CHANGE_TYPE) {
    if (useType === 'Task') {
      allowedTypes.unshift('Local');
    }
  } else if (comment.comment_type === TODO_TYPE) {
    if (useType === 'Suggestion') {
      allowedTypes.unshift('Local');
    }
  } else if (comment.comment_type === REPLY_TYPE) {
    allowedTypes.unshift('Local');
  }
  const myPresence = presences.find((presence) => presence.current_user) || {};
  const investible = getInvestible(investiblesState, comment.investible_id);
  const marketInfo = getMarketInfo(investible, marketId);
  const { assigned: invAssigned, stage: currentStageId } = marketInfo || {};
  const assigned = invAssigned || [];
  const myPresenceIsAssigned = assigned.includes(myPresence.id);

  function myAccept () {
    return updateComment({ marketId, commentId: comment.id, commentType: TODO_TYPE }).then((comment) => {
      handleAcceptSuggestion({
        isMove: myPresenceIsAssigned && myPresence.id === comment.created_by &&
          isSingleAssisted(comments, assigned), comment, investible, investiblesDispatch, marketStagesState,
        commentsState, commentsDispatch, messagesState
      });
      setOperationRunning(false);
      navigate(history, formCommentLink(marketId, comment.group_id, comment.investible_id, comment.id));
    });
  }

  function myMoveToSuggestion () {
    const isInAssistance = getFullStage(marketStagesState, marketId, currentStageId).move_on_comment;
    return updateComment({ marketId, commentId: comment.id, commentType: SUGGEST_CHANGE_TYPE })
      .then((comment) => {
        addCommentToMarket(comment, commentsState, commentsDispatch);
        if (myPresenceIsAssigned && myPresence.id === comment.created_by && !isInAssistance) {
          changeInvestibleStageOnCommentOpen(false, true, marketStagesState,
            [marketInfo], investible.investible, investiblesDispatch, comment, myPresence);
          quickNotificationChanges(comment.comment_type, comment.investible_id, messagesState, messagesDispatch,
            [], comment, undefined, commentsState, commentsDispatch, comment.market_id,
            myPresence);
        }
        setOperationRunning(false);
        navigate(history, formCommentLink(marketId, comment.group_id, comment.investible_id, comment.id));
      });
  }

  function getNextFunction() {
    if (destination === 'Local') {
      if (useType === 'Task') {
        return myAccept;
      }
      if (useType === 'Suggestion') {
        return myMoveToSuggestion;
      }
    }
    // destination === 'Other'
    return () => navigate(history,
      `${formMarketAddInvestibleLink(marketId, comment.group_id)}&fromCommentId=${comment.id}&commentType=${useType}`);
  }

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
      <Typography className={classes.introText}>
        Move to where?
      </Typography>
      <CommentBox
        comments={comments}
        marketId={marketId}
        allowedTypes={[]}
        isInbox
        compressAll
        inboxMessageId={comment?.id}
        displayRepliesAsTop={comment.comment_type === REPLY_TYPE}
        removeActions
        toggleCompression={() => updateFormData({ useCompression: !useCompression })}
        useCompression={useCompression}
      />
      <div style={{marginBottom: '2rem'}} />
      <FormControl component="fieldset">
        <RadioGroup
          aria-labelledby="type-choice"
          onChange={(event) => {
            const { value } = event.target;
            updateFormData({ destination: value });
          }}
          value={destination || ''}
        >
          {allowedTypes.map((objectType) => {
            return (
              <FormControlLabel
                id={`type${objectType}`}
                key={objectType}
                /* prevent clicking the label stealing focus */
                onMouseDown={e => e.preventDefault()}
                control={<Radio color="primary"/>}
                label={<FormattedMessage id={`${objectType !== 'Discussion' ? useType : ''}${objectType}MoveLabel`}/>}
                labelPlacement="end"
                value={objectType}
              />
            );
          })}
        </RadioGroup>
      </FormControl>
      <div className={classes.borderBottom}/>
      <WizardStepButtons
        {...props}
        validForm={!_.isEmpty(useType)}
        onNext={getNextFunction()}
        onNextDoAdvance={false}
        isFinal
        spinOnClick={(useType === 'Task' && destination === 'Local')||
          (useType === 'Suggestion' && ['Local', 'Discussion'].includes(destination))}
        showTerminate
        onTerminate={previousStep}
        terminateLabel="OnboardingWizardGoBack"
      />
    </WizardStepContainer>
  );
}

WhereDecisionStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

WhereDecisionStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default WhereDecisionStep;