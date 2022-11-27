import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import CommentBox from '../../../containers/CommentBox/CommentBox'
import {
  addCommentToMarket,
  getCommentRoot
} from '../../../contexts/CommentsContext/commentsContextHelper'
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'
import {
  addInvestible,
  getInvestible
} from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { getMarketInfo } from '../../../utils/userFunctions'
import { getFullStage, isRequiredInputStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { useHistory } from 'react-router'
import { wizardFinish } from '../InboxWizardUtils'
import { formCommentLink, formMarketAddInvestibleLink } from '../../../utils/marketIdPathFunctions'
import { removeWorkListItem, workListStyles } from '../../../pages/Home/YourWork/WorkListItem'
import { reopenComment, resolveComment } from '../../../api/comments'
import _ from 'lodash'
import { SUGGEST_CHANGE_TYPE } from '../../../constants/comments'
import { onCommentOpen } from '../../../utils/commentFunctions'


function DecideResolveStep(props) {
  const { marketId, commentId, clearFormData, message } = props;
  const [commentState, commentDispatch] = useContext(CommentsContext);
  const [investibleState] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [investiblesState, investiblesDispatch] = useContext(InvestiblesContext);
  const history = useHistory();
  const commentRoot = getCommentRoot(commentState, marketId, commentId) || {id: 'fake'};
  const comments = (commentState[marketId] || []).filter((comment) =>
    comment.root_comment_id === commentRoot.id || comment.id === commentRoot.id);
  const classes = useContext(WizardStylesContext);
  const workItemClasses = workListStyles();
  const inv = commentRoot.investible_id ? getInvestible(investibleState, commentRoot.investible_id) : undefined;
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { stage, former_stage_id: formerStageId } = marketInfo;
  const fullStage = getFullStage(marketStagesState, marketId, stage) || {};
  const isFullyVoted = message.type === 'FULLY_VOTED';
  const isSuggestion = commentRoot.comment_type === SUGGEST_CHANGE_TYPE;
  const isReopen = message.messageType === 'UNREAD_RESOLVED';

  function myTerminate(isNavigate) {
    if (isNavigate) {
      wizardFinish({
          link: formCommentLink(marketId, commentRoot.group_id, commentRoot.investible_id,
            commentRoot.id)
        },
        setOperationRunning, message, history);
    } else {
      removeWorkListItem(message, workItemClasses.removed);
    }
  }

  function reopen() {
    return reopenComment(marketId, commentId)
      .then((comment) => {
        onCommentOpen(investiblesState, commentRoot.investible_id, marketStagesState, marketId, comment,
          investiblesDispatch, commentState, commentDispatch);
        setOperationRunning(false);
        removeWorkListItem(message, workItemClasses.removed);
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
        clearFormData();
        if (isGotoJob) {
          if (inv) {
            wizardFinish({}, setOperationRunning, message, history);
          } else {
            wizardFinish(
              {
                link: `${formMarketAddInvestibleLink(marketId, commentRoot.group_id)}&fromCommentId=${commentId}`
              },
              setOperationRunning, message, history);
          }
        } else {
          setOperationRunning(false);
          removeWorkListItem(message, workItemClasses.removed);
        }
      });
  }
  // TODO rework this once have answer on https://production.uclusion.com/dialog/4e84f9b9-33ae-47e3-9f85-5048d36f5608/78179afa-b093-4df4-a0df-01c93a846bce#cf0175bcb-ca02-4442-9514-04927a4cb8ed
  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText}>
        {isReopen ? 'Do you reopen your comment that someone resolved?'
          : `Can you resolve this ${isSuggestion ? 'suggestion' : 'question'}?`}
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        {isFullyVoted ? 'All votes collected.' : 'New vote.'}
      </Typography>
      <div style={{paddingBottom: '1rem'}}>
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
        />
      </div>
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
          : 'DecideWizardContinue'}
        onOtherNext={() => {
          if (isFullyVoted) {
            return resolve(true);
          }
          return myTerminate(true);
        }}
        showTerminate={true}
        onFinish={() => myTerminate(isFullyVoted)}
        terminateLabel={isFullyVoted ? 'DecideWizardContinue': 'notificationDismiss'}
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