import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import { addCommentToMarket, getCommentRoot } from '../../../contexts/CommentsContext/commentsContextHelper';
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
import { onCommentOpen } from '../../../utils/commentFunctions';
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
  const [, messagesDispatch] = useContext(NotificationsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [selectedInvestibleId, setSelectedInvestibleId] = useState(message.decision_investible_id
    || message.investible_id);
  const history = useHistory();
  const presences = getMarketPresences(marketPresencesState, marketId);
  const myPresence = presences?.find((presence) => presence.current_user) || {};
  const commentRoot = getCommentRoot(commentState, marketId, commentId) || {id: 'fake'};
  const comments = (commentState[marketId] || []).filter((comment) =>
    comment.root_comment_id === commentRoot.id || comment.id === commentRoot.id);
  const classes = wizardStyles();
  const inv = commentRoot.investible_id ? getInvestible(investiblesState, commentRoot.investible_id)
    : undefined;
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { stage, former_stage_id: formerStageId } = marketInfo;
  const fullStage = getFullStage(marketStagesState, marketId, stage) || {};
  const isSuggestion = commentRoot.comment_type === SUGGEST_CHANGE_TYPE;
  const isReopen = message.type === 'UNREAD_RESOLVED';
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
        dismissWorkListItem(message, messagesDispatch, history);
      });
  }

  function acceptAndMove() {
    return updateComment({marketId, commentId, commentType: TODO_TYPE}).then((comment) => {
      addCommentToMarket(comment, commentState, commentDispatch);
      setOperationRunning(false);
      if (!commentRoot.investible_id) {
        // Only need to move if market suggestion
        navigate(history, `${formMarketAddInvestibleLink(marketId, comment.group_id)}&fromCommentId=${comment.id}`);
      }
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
                link: `${formMarketAddInvestibleLink(marketId, commentRoot.group_id)}&fromCommentId=${commentId}`
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
  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        {isReopen ? 'Do you reopen your comment that someone resolved?'
          : `Can you resolve this ${isSuggestion ? 'suggestion' : 'question'}?`}
      </Typography>
      {!isReopen && (
        <Typography className={classes.introSubText} variant="subtitle1">
          New vote(s).
        </Typography>
      )}
      {isReopen && isInReviewStage(fullStage) && (
        <Typography className={classes.introSubText} variant="subtitle1">
          This job is complete.
        </Typography>
      )}
      {commentRoot.investible_id && (
        <JobDescription marketId={marketId} investibleId={commentRoot.investible_id} comments={comments}
                        removeActions
                        showVoting
                        showDescription={false}
                        showAssigned={false}
                        useCompression={useCompression}
                        toggleCompression={() => updateFormData({useCompression: !useCompression})}
                        selectedInvestibleIdParent={selectedInvestibleId}
                        setSelectedInvestibleIdParent={setSelectedInvestibleId} />
      )}
      {!commentRoot.investible_id && (
        <div className={classes.wizardCommentBoxDiv}>
          <CommentBox
            comments={comments}
            marketId={marketId}
            allowedTypes={[]}
            fullStage={fullStage}
            investible={inv}
            marketInfo={marketInfo}
            isInbox
            removeActions
            showVoting
            selectedInvestibleIdParent={selectedInvestibleId}
            setSelectedInvestibleIdParent={setSelectedInvestibleId}
          />
        </div>
      )}
      {isOpenSuggestion && (
        <WizardStepButtons
          {...props}
          nextLabel="moveToTaskLabel"
          onNext={() => acceptAndMove()}
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
          nextLabel="BugWizardMoveToJob"
          isFinal={false}
          spinOnClick={false}
          onNext={() => navigate(history,
            `${formMarketAddInvestibleLink(marketId, commentRoot.group_id)}&fromCommentId=${commentId}`)}
          showOtherNext
          otherNextLabel="commentResolveLabel"
          onOtherNext={() => resolve(false)}
          isOtherFinal
          otherSpinOnClick
          showTerminate={true}
          onFinish={() => myTerminate()}
          terminateLabel="notificationDismiss"
        />
      )}
      {!isOpenSuggestion && !isMarketQuestion && !isReopen && (
        <WizardStepButtons
          {...props}
          nextLabel="commentResolveLabel"
          onNext={() => resolve(false)}
          showOtherNext
          otherNextLabel="DecideResolveAndGoJob"
          onOtherNext={() => resolve(true)}
          otherSpinOnClick
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