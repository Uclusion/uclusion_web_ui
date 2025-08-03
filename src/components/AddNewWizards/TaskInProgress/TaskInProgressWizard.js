import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import RemoveInProgressStep from './RemoveInProgressStep';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import _ from 'lodash';
import { usePresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { getMarketInfo } from '../../../utils/userFunctions';
import { getNotDoingStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { getComment, getInvestibleComments, getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { REPLY_TYPE, TODO_TYPE } from '../../../constants/comments';

export function previousInProgress(userId, currentComment, investibleState, commentsState, notDoingStageId) {
  const currentCommentId = currentComment?.id;
  const marketId = currentComment.market_id;
  const marketComments = getMarketComments(commentsState, marketId, currentComment.group_id);
  const inProgressComments = marketComments.filter((comment) => !comment.resolved && comment.in_progress &&
    comment.id !== currentCommentId);
  return inProgressComments.filter((comment) => {
    if (comment.comment_type === REPLY_TYPE) {
      // Subtasks do not count as other in progress unless current comment is a subtask on the same parent
      if (currentComment?.comment_type !== REPLY_TYPE || currentComment.root_comment_id !== comment.root_comment_id) {
        return false;
      }
    }
    // Resolved do not count as subtasks
    const parent = getComment(commentsState, marketId, comment.root_comment_id || comment.id);
    if (parent?.resolved) {
      return false;
    }
    const inv = getInvestible(investibleState, comment.investible_id) || {};
    const marketInfo = getMarketInfo(inv, marketId) || {};
    const { stage, assigned} = marketInfo;
    if (!assigned?.includes(userId)) {
      return false;
    }
    return stage !== notDoingStageId;
  });
}

function TaskInProgressWizard(props) {
  const { marketId, commentId, investibleId } = props;
  const [investibleState] = useContext(InvestiblesContext);
  const [commentsState] = useContext(CommentsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const presences = usePresences(marketId);
  const comment = commentId ? getComment(commentsState, marketId, commentId) : undefined;
  const myPresence = presences.find((presence) => presence.current_user);
  const notDoingStage = getNotDoingStage(marketStagesState, marketId)
  const otherInProgressRaw = commentId ? previousInProgress(myPresence?.id, comment, investibleState, commentsState
    , notDoingStage?.id) : undefined;
  // For subtasks don't encourage taking the root task out of progress
  const otherInProgress = commentId ? (comment?.comment_type === REPLY_TYPE ?
    otherInProgressRaw.filter((aComment) => aComment.id !== comment?.root_comment_id) : otherInProgressRaw) : undefined;
  const investibleComments = investibleId ? getInvestibleComments(investibleId, marketId, commentsState) : undefined;
  const tasksInProgress = investibleComments?.filter((comment) => !comment.resolved && !comment.deleted && 
    comment.comment_type === TODO_TYPE && comment.in_progress);

  if (_.isEmpty(otherInProgress||tasksInProgress)) {
    return React.Fragment;
  }

  return (
    <WizardStylesProvider>
      <FormdataWizard name={`task_in_progress_wizard${comment?.investible_id}`}
                      defaultFormData={{useCompression: true}} useLocalStorage={false}>
          <RemoveInProgressStep otherInProgress={otherInProgress || tasksInProgress} comment={comment} marketId={marketId} />
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

TaskInProgressWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

TaskInProgressWizard.defaultProps = {
  onStartOver: () => {},
  onFinish: () => {},
  showCancel: true
}

export default TaskInProgressWizard;

