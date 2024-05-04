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
import { SUGGEST_CHANGE_TYPE, TODO_TYPE } from '../../../constants/comments';
import { alterComment, updateComment } from '../../../api/comments';
import {
  changeInvestibleStageOnCommentOpen,
  handleAcceptSuggestion,
  isSingleAssisted
} from '../../../utils/commentFunctions';
import _ from 'lodash';
import {
  addCommentToMarket,
  addMarketComments,
  getMarketComments
} from '../../../contexts/CommentsContext/commentsContextHelper';
import { quickNotificationChanges } from '../../Comments/CommentAdd';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { usePresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { getMarketInfo } from '../../../utils/userFunctions';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';

function BugDecisionStep (props) {
  const { marketId, comment, comments, updateFormData, formData } = props;
  const history = useHistory();
  const classes = useContext(WizardStylesContext);
  const presences = usePresences(marketId);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [investiblesState, investiblesDispatch] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const allowedTypes = ['Job'];
  if (comment.comment_type === SUGGEST_CHANGE_TYPE) {
    allowedTypes.unshift('ConvertTask');
    allowedTypes.push('Discussion');
  } else if (comment.comment_type === TODO_TYPE) {
    allowedTypes.push('ConvertSuggestion');
    allowedTypes.push('Bug');
  }
  const myPresence = presences.find((presence) => presence.current_user) || {};
  const investible = getInvestible(investiblesState, comment.investible_id);
  const marketInfo = getMarketInfo(investible, marketId);
  const { assigned: invAssigned } = marketInfo || {};
  const assigned = invAssigned || [];
  const myPresenceIsAssigned = assigned.includes(myPresence.id);
  const { useCompression, useType } = formData;

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
    return updateComment({ marketId, commentId: comment.id, commentType: SUGGEST_CHANGE_TYPE })
      .then((comment) => {
        const withNewComment = _.concat(comments, comment);
        addCommentToMarket(comment, commentsState, commentsDispatch);
        if (myPresenceIsAssigned && myPresence.id === comment.created_by && isSingleAssisted(withNewComment, assigned))
        {
          changeInvestibleStageOnCommentOpen(false, true, marketStagesState,
            [marketInfo], investible, investiblesDispatch, comment, myPresence);
          quickNotificationChanges(comment.comment_type, comment.investible_id, messagesState, messagesDispatch,
            [], comment, undefined, commentsState, commentsDispatch, comment.market_id,
            myPresence);
        }
        setOperationRunning(false);
        navigate(history, formCommentLink(marketId, comment.group_id, comment.investible_id, comment.id));
      });
  }

  function moveToDiscussion() {
    return alterComment(marketId, comment.id)
      .then((response) => {
        addCommentToMarket(response, commentsState, commentsDispatch);
        const marketComments = getMarketComments(commentsState, marketId, comment.group_id);
        const thread = marketComments.filter((aComment) => {
          return aComment.root_comment_id === comment.id;
        });
        const fixedThread = thread.map((aComment) => {
          return _.omit(aComment, 'investible_id');
        });
        addMarketComments(commentsDispatch, marketId, [...fixedThread]);
        setOperationRunning(false);
        navigate(history, formCommentLink(marketId, comment.group_id, undefined, comment.id));
      });
  }

  function getNextFunction() {
    if (useType === 'ConvertTask') {
      return myAccept;
    }
    if (useType === 'ConvertSuggestion') {
      return myMoveToSuggestion;
    }
    if (useType === 'Discussion') {
      return moveToDiscussion;
    }
    if (useType === 'Job') {
      return () => navigate(history,
        `${formMarketAddInvestibleLink(marketId, comment.group_id)}&fromCommentId=${comment.id}`);
    }
    return undefined;
  }

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
      <Typography className={classes.introText}>
        Move to what?
      </Typography>
      <CommentBox
        comments={comments}
        marketId={marketId}
        allowedTypes={[]}
        isInbox
        compressAll
        inboxMessageId={comment?.id}
        removeActions
        toggleCompression={() => updateFormData({ useCompression: !useCompression })}
        useCompression={useCompression}
      />
      <div className={classes.borderBottom}/>
      <FormControl component="fieldset">
        <RadioGroup
          aria-labelledby="type-choice"
          onChange={(event) => {
            const { value } = event.target;
            updateFormData({ useType: value });
          }}
          value={useType || ''}
        >
          {allowedTypes.map((objectType) => {
            return (
              <FormControlLabel
                id={`type${objectType}`}
                key={objectType}
                /* prevent clicking the label stealing focus */
                onMouseDown={e => e.preventDefault()}
                control={<Radio color="primary"/>}
                label={<FormattedMessage id={`${objectType}MoveLabel`}/>}
                labelPlacement="end"
                value={objectType}
              />
            );
          })}
        </RadioGroup>
      </FormControl>
      <WizardStepButtons
        {...props}
        validForm={!_.isEmpty(useType)}
        onNext={getNextFunction()}
        isFinal={useType?.startsWith('Convert')||useType === 'Discussion'}
        spinOnClick={useType?.startsWith('Convert')||useType === 'Discussion'}
        showTerminate
        terminateLabel="OnboardingWizardGoBack"
        onTerminate={() => navigate(history, formCommentLink(marketId, comment.group_id, comment.investible_id,
          comment.id))}
      />
    </WizardStepContainer>
  );
}

BugDecisionStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

BugDecisionStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default BugDecisionStep;