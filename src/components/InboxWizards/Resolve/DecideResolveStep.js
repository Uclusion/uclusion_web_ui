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
import { formCommentLink, formMarketAddInvestibleLink } from '../../../utils/marketIdPathFunctions';
import { dismissWorkListItem, removeWorkListItem } from '../../../pages/Home/YourWork/WorkListItem';
import { reopenComment, resolveComment } from '../../../api/comments';
import _ from 'lodash';
import { SUGGEST_CHANGE_TYPE } from '../../../constants/comments';
import { onCommentOpen } from '../../../utils/commentFunctions';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import JobDescription from '../JobDescription';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';

function DecideResolveStep(props) {
  const { marketId, commentId, message } = props;
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
  const isFullyVoted = message.type === 'FULLY_VOTED';
  const isSuggestion = commentRoot.comment_type === SUGGEST_CHANGE_TYPE;
  const isReopen = message.type === 'UNREAD_RESOLVED';

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

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText}>
        {isReopen ? 'Do you reopen your comment that someone resolved?'
          : `Can you resolve this ${isSuggestion ? 'suggestion' : 'question'}?`}
      </Typography>
      {!isReopen && (
        <Typography className={classes.introSubText} variant="subtitle1">
          {isFullyVoted ? 'All votes collected.' : 'New vote.'}
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
      <WizardStepButtons
        {...props}
        nextLabel={isReopen ? 'commentReopenLabel' : 'commentResolveLabel'}
        onNext={() => {
          if (isReopen) {
            return reopen();
          }
          return resolve(false);
        }}
        showOtherNext={!isReopen}
        otherNextLabel={isFullyVoted ? (inv ? 'DecideResolveAndGoJob' : 'DecideResolveAndMoveToJob')
          : 'notificationDelete'}
        onOtherNext={() => {
          if (isFullyVoted) {
            return resolve(true);
          }
          return myTerminate();
        }}
        otherSpinOnClick={isFullyVoted}
        showTerminate={true}
        onFinish={() => myTerminate()}
        terminateLabel={isFullyVoted ? 'notificationDelete': 'notificationDismiss'}
      />
    </div>
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