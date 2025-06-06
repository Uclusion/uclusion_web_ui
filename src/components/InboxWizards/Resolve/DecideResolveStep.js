import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import {
  addCommentToMarket,
  getCommentRoot, getInvestibleComments,
  getMarketComments
} from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { addInvestible, getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { getMarketInfo } from '../../../utils/userFunctions';
import {
  getFullStage, isInReviewStage,
  isRequiredInputStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { useHistory } from 'react-router';
import { wizardFinish } from '../InboxWizardUtils';
import { formCommentLink, formMarketAddInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';
import { dismissWorkListItem, removeWorkListItem } from '../../../pages/Home/YourWork/WorkListItem';
import { reopenComment, resolveComment, updateComment } from '../../../api/comments';
import _ from 'lodash';
import { SUGGEST_CHANGE_TYPE, TODO_TYPE } from '../../../constants/comments';
import { handleAcceptSuggestion, isSingleAssisted, onCommentOpen } from '../../../utils/commentFunctions';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import JobDescription from '../JobDescription';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';

function DecideResolveStep(props) {
  const { marketId, commentId, message, formData, updateFormData } = props;
  const [commentState, commentDispatch] = useContext(CommentsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [investiblesState, investiblesDispatch] = useContext(InvestiblesContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const selectedInvestibleId = message.decision_investible_id || message.investible_id;
  const history = useHistory();
  const presences = getMarketPresences(marketPresencesState, marketId);
  const myPresence = presences?.find((presence) => presence.current_user) || {};
  const commentRoot = getCommentRoot(commentState, marketId, commentId) || {id: 'fake'};
  const marketComments = getMarketComments(commentState, marketId, commentRoot.group_id);
  const comments = marketComments.filter((comment) =>
    comment.root_comment_id === commentRoot.id || comment.id === commentRoot.id);
  const investibleComments = commentRoot.investible_id ?
    getInvestibleComments(commentRoot.investible_id, marketId, commentState) : undefined;
  const classes = wizardStyles();
  const inv = commentRoot.investible_id ? getInvestible(investiblesState, commentRoot.investible_id)
    : undefined;
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { stage, former_stage_id: formerStageId, assigned } = marketInfo;
  const fullStage = getFullStage(marketStagesState, marketId, stage) || {};
  const isSuggestion = commentRoot.comment_type === SUGGEST_CHANGE_TYPE;
  const isReopen = message.type === 'UNREAD_RESOLVED';
  const isSingle = commentRoot.investible_id ? isSingleAssisted(investibleComments, assigned) : false;
  const { useCompression } = formData;

  function myTerminate() {
    removeWorkListItem(message, messagesDispatch, history);
  }

  function reopen() {
    return reopenComment(marketId, commentId)
      .then((comment) => {
        onCommentOpen(investiblesState, commentRoot.investible_id, marketStagesState, marketId, comment,
          investiblesDispatch, commentState, commentDispatch, myPresence);
        setOperationRunning(false);
        dismissWorkListItem(message, messagesDispatch);
        navigate(history, formCommentLink(marketId, comment.group_id, comment.investible_id, comment.id));
      });
  }

  function acceptAndMove() {
    return updateComment({marketId, commentId, commentType: TODO_TYPE}).then((comment) => {
      handleAcceptSuggestion({ isMove: isSingle, comment, investible: inv, investiblesDispatch,
        marketStagesState, commentState, commentDispatch, messagesState, messagesDispatch })
      setOperationRunning(false);
      navigate(history, formCommentLink(marketId, comment.group_id, comment.investible_id, comment.id));
    })
  }

  function resolve(isGotoJob) {
    return resolveComment(marketId, commentId)
      .then((comment) => {
        addCommentToMarket(comment, commentState, commentDispatch);
        if (formerStageId && fullStage && isRequiredInputStage(fullStage)) {
          const newInfo = {
            ...marketInfo,
            stage: formerStageId,
            last_stage_change_date: comment.updated_at,
          };
          const newInfos = _.unionBy([newInfo], inv.market_infos, 'id');
          const newInvestible = {
            investible: inv.investible,
            market_infos: newInfos
          };
          addInvestible(investiblesDispatch, () => {}, newInvestible);
        }
        if (isGotoJob) {
          if (inv) {
            wizardFinish({
              link: `${formCommentLink(marketId, commentRoot.group_id, commentRoot.investible_id, commentId)}`
            }, setOperationRunning, message, history, marketId, commentRoot.investible_id, messagesDispatch);
          } else {
            wizardFinish(
              {
                link: `${formMarketAddInvestibleLink(marketId, commentRoot.group_id, undefined, 
                  message.type_object_id)}&fromCommentId=${commentId}`
              },
              setOperationRunning, message, history, marketId, commentRoot.investible_id, messagesDispatch);
          }
        } else {
          setOperationRunning(false);
          dismissWorkListItem(message, messagesDispatch, history);
        }
      });
  }
  const isOpenSuggestion = isSuggestion && !isReopen;
  const isMarketQuestion = !isSuggestion && !inv && !isReopen;
  const isInvestibleQuestion = !isOpenSuggestion && !isMarketQuestion && !isReopen;
  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        {isReopen ? 'Do you reopen your comment that someone resolved?'
          : `Done with this ${isSuggestion ? 'suggestion' : 'question'}?`}
      </Typography>
      {!isReopen && (
        <Typography className={classes.introSubText} variant="subtitle1">
          New vote(s).
        </Typography>
      )}
      {isReopen && inv && isInReviewStage(fullStage) && (
        <Typography className={classes.introSubText} variant="subtitle1">
          This job is complete.
        </Typography>
      )}
      <JobDescription marketId={marketId} investibleId={commentRoot.investible_id} comments={comments}
                      removeActions={!isInvestibleQuestion}
                      showVoting
                      isSingleTaskDisplay={commentRoot.comment_type === TODO_TYPE}
                      inboxMessageId={commentId}
                      useCompression={useCompression}
                      toggleCompression={() => updateFormData({ useCompression: !useCompression })}
                      selectedInvestibleIdParent={selectedInvestibleId}/>
      <div className={classes.borderBottom}/>
      {isOpenSuggestion && (
        <WizardStepButtons
          {...props}
          focus
          nextLabel={commentRoot.investible_id ? 'moveToTaskLabel' : 'BugWizardMoveToJob'}
          onNextDoAdvance={false}
          onNext={commentRoot.investible_id ? acceptAndMove : () =>
            navigate(history, `${formMarketAddInvestibleLink(marketId, commentRoot.group_id, undefined,
              message.type_object_id)}&fromCommentId=${commentRoot.id}`)}
          showOtherNext
          otherNextLabel="commentResolveLabel"
          onOtherNext={() => resolve(false)}
          showTerminate={true}
          onFinish={() => myTerminate()}
          terminateLabel="notificationDismiss"
        />
      )}
      {isReopen && (
        <WizardStepButtons
          {...props}
          focus
          nextLabel="commentReopenLabel"
          onNext={() => reopen()}
          showTerminate={true}
          onFinish={() => myTerminate()}
          terminateLabel="notificationDismiss"
        />
      )}
      {isMarketQuestion && (
        <WizardStepButtons
          {...props}
          focus
          nextLabel="BugWizardMoveToJob"
          spinOnClick={false}
          onNextDoAdvance={false}
          onNext={() => navigate(history,
            `${formMarketAddInvestibleLink(marketId, commentRoot.group_id, undefined,
              message.type_object_id)}&fromCommentId=${commentId}`)}
          showOtherNext
          otherNextLabel="commentResolveLabel"
          onOtherNext={() => resolve(false)}
          otherSpinOnClick
          showTerminate={true}
          onFinish={() => myTerminate()}
          terminateLabel="notificationDismiss"
        />
      )}
      {isInvestibleQuestion && (
        <WizardStepButtons
          {...props}
          showNext={false}
          showTerminate={true}
          onFinish={() => myTerminate()}
          terminateLabel="notificationDismiss"
        />
      )}
    </WizardStepContainer>
  );
}

DecideResolveStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

DecideResolveStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default DecideResolveStep;